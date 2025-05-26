const { Worker } = require("worker_threads");
const path = require("path");
const Activity = require("../models/Activity");
const Room = require("../models/Room");
const Timeslot = require("../models/Timeslot");
const Schedule = require("../models/Schedule");
require("../models/User");

// Store active workers
const activeWorkers = new Map();

// Cleanup completed workers periodically
setInterval(() => {
  for (const [workerId, worker] of activeWorkers.entries()) {
    if (worker.status === "completed" || worker.status === "failed") {
      try {
        worker.worker.terminate();
        activeWorkers.delete(workerId);
      } catch (error) {
        console.error(`Error cleaning up worker ${workerId}:`, error);
      }
    }
  }
}, 600000); // Cleanup every 10 minutes

/*
 * Utility function to shuffle an array in place using Fisher-Yates algorithm.
 * Used to randomize domain assignments in backtracking for varied solutions.
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/*
 * Converts a time string (HH:MM) to minutes since midnight for comparison.
 * Assumes valid input; minutes are optional (e.g., "14:00" or "14").
 */
function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + (minutes || 0);
}

/**
 * Fetches unique days from non-deleted timeslots, sorted for consistent ordering.
 * Used to organize timeslots by day in scheduling.
 */
async function getDynamicDays() {
  const timeslots = await Timeslot.find({ isDeleted: false }).lean();
  const days = [...new Set(timeslots.map((ts) => ts.day))].sort();
  return days;
}

/*
 * Sorts rooms to balance usage and match activity requirements.
 * Prioritizes less-used rooms and those meeting room type and capacity needs.
 */
function sortRooms(rooms, activity, schedule) {
  const roomUsage = rooms.reduce(
    (acc, room) => ({ ...acc, [room._id]: 0 }),
    {}
  );
  schedule.forEach((entry) => {
    if (entry.room) {
      roomUsage[entry.room.toString()] =
        (roomUsage[entry.room.toString()] || 0) + 1;
    }
  });
  const filteredRooms = [...rooms].filter(
    (room) =>
      !activity.roomRequirement || room.type === activity.roomRequirement
  );
  return filteredRooms.sort((a, b) => {
    const usageA = roomUsage[a._id.toString()] || 0;
    const usageB = roomUsage[b._id.toString()] || 0;
    if (usageA !== usageB) return usageA - usageB;
    if (a.capacity !== b.capacity) return a.capacity - b.capacity;
    return a._id.toString().localeCompare(b._id.toString());
  });
}

/*
 * Validates a single timeslot assignment for an activity and room.
 * Checks room type, capacity, and conflicts within the current schedule.
 * IMPORTANT: No checks against existing schedules in DB; relies on Schedule.deleteMany to clear prior conflicts.
 */
async function isValidAssignmentSingleTimeslot(
  activity,
  timeslot,
  room,
  schedule,
  usedTimeslots,
  usedActivityTimeslots
) {
  // Verify room meets activity requirements
  if (activity.roomRequirement && room.type !== activity.roomRequirement) {
    return false;
  }
  const studentGroup = activity.studentGroup || {};
  const defaultEnrollment = 50;
  if (room.capacity < (studentGroup.expectedEnrollment || defaultEnrollment)) {
    return false;
  }
  // Check for conflicts in the current schedule (room, lecturer, student group, activity)
  for (const entry of schedule) {
    if (!entry.room || !entry.activityData) {
      console.error("Invalid schedule entry:", entry);
      return false;
    }
    if (
      entry.room.toString() === room._id.toString() &&
      entry.reservedTimeslots.some(
        (tsId) => tsId.toString() === timeslot._id.toString()
      )
    ) {
      return false;
    }

    // Check lecturer conflicts with proper null checks
    const entryLectureId = entry.activityData.lecture?._id?.toString();
    const activityLectureId = activity.lecture?._id?.toString();
    if (
      entryLectureId &&
      activityLectureId &&
      entryLectureId === activityLectureId &&
      entry.reservedTimeslots.some(
        (tsId) => tsId.toString() === timeslot._id.toString()
      )
    ) {
      return false;
    }

    // Check student group conflicts
    if (
      activity.studentGroup?._id &&
      entry.activityData.studentGroup?._id &&
      entry.activityData.studentGroup._id.toString() ===
        activity.studentGroup._id.toString() &&
      entry.reservedTimeslots.some(
        (tsId) => tsId.toString() === timeslot._id.toString()
      )
    ) {
      return false;
    }
    if (
      (entry.activityData.originalId || entry.activityData._id).toString() ===
        (activity.originalId || activity._id).toString() &&
      entry.reservedTimeslots.some(
        (tsId) => tsId.toString() === timeslot._id.toString()
      )
    ) {
      return false;
    }
  }
  // Ensure timeslot-room and activity-timeslot combinations are unique
  const timeslotRoomKey = `${timeslot._id}-${room._id}`;
  if (usedTimeslots.has(timeslotRoomKey)) {
    return false;
  }
  const activityTimeslotKey = `${activity.originalId || activity._id}-${
    timeslot._id
  }-${activity.studentGroup?._id || "N/A"}`;
  if (usedActivityTimeslots.has(activityTimeslotKey)) {
    return false;
  }
  return true;
}

/*
 * Validates an assignment for an activity, handling both single and multi-timeslot sessions.
 * Ensures consecutive timeslots for longer sessions and checks lecturer load.
 * IMPORTANT: Debug if long sessions (e.g., 3.5 hours) fail due to non-consecutive timeslots.
 */
async function isValidAssignment(
  activity,
  startTimeslot,
  room,
  schedule,
  lectureLoad,
  usedTimeslots,
  usedActivityTimeslots,
  allTimeslots
) {
  const sessionMinutes = activity.sessionDuration * 60;
  const timeslotDuration =
    parseTime(startTimeslot.endTime) - parseTime(startTimeslot.startTime);

  // Handle single-timeslot sessions
  if (sessionMinutes <= timeslotDuration) {
    if (
      await isValidAssignmentSingleTimeslot(
        activity,
        startTimeslot,
        room,
        schedule,
        usedTimeslots,
        usedActivityTimeslots
      )
    ) {
      return [startTimeslot];
    }
    return false;
  }

  // Handle multi-timeslot sessions
  const sameDayTimeslots = allTimeslots
    .filter((ts) => ts.day === startTimeslot.day)
    .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));

  const startIndex = sameDayTimeslots.findIndex(
    (ts) => ts._id.toString() === startTimeslot._id.toString()
  );
  if (startIndex === -1) {
    console.error(`Start timeslot ${startTimeslot._id} not found`);
    return false;
  }

  // Accumulate timeslots until session duration is met
  let totalDuration = 0;
  let endIndex = startIndex;
  while (endIndex < sameDayTimeslots.length && totalDuration < sessionMinutes) {
    totalDuration +=
      parseTime(sameDayTimeslots[endIndex].endTime) -
      parseTime(sameDayTimeslots[endIndex].startTime);
    endIndex++;
  }
  endIndex--;

  if (totalDuration < sessionMinutes) {
    return false;
  }

  const selectedTimeslots = sameDayTimeslots.slice(startIndex, endIndex + 1);

  // Ensure timeslots are consecutive
  for (let i = 0; i < selectedTimeslots.length - 1; i++) {
    const currentEnd = parseTime(selectedTimeslots[i].endTime);
    const nextStart = parseTime(selectedTimeslots[i + 1].startTime);
    if (currentEnd !== nextStart) {
      return false;
    }
  }

  // Validate each timeslot
  for (const timeslot of selectedTimeslots) {
    if (
      !(await isValidAssignmentSingleTimeslot(
        activity,
        timeslot,
        room,
        schedule,
        usedTimeslots,
        usedActivityTimeslots
      ))
    ) {
      return false;
    }
  }

  // Check lecturer load
  const lectureId = activity.lecture?._id;
  if (!lectureId) {
    console.error("Lecture ID undefined for activity:", activity);
    return false;
  }
  const currentLoad = lectureLoad.get(lectureId.toString()) || 0;
  if (
    activity.lecture.maxLoad &&
    currentLoad + activity.sessionDuration > activity.lecture.maxLoad
  ) {
    return false;
  }

  return selectedTimeslots;
}

/*
 * Sorts activities by the number of valid assignment options to prioritize constrained ones.
 * Randomizes order after the first attempt to explore different solutions.
 * IMPORTANT: Log validOptions if scheduling fails to identify overly constrained activities.
 */
async function sortActivities(activities, rooms, timeslots, randomize = false) {
  const activityConstraints = [];
  for (const activity of activities) {
    let validOptions = 0;
    for (const timeslot of timeslots) {
      const sessionMinutes = activity.sessionDuration * 60;
      const sameDayTimeslots = timeslots
        .filter((ts) => ts.day === timeslot.day)
        .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));
      const startIndex = sameDayTimeslots.findIndex(
        (ts) => ts._id.toString() === timeslot._id.toString()
      );
      if (startIndex === -1) continue;
      const requiredSlots = Math.ceil(
        sessionMinutes /
          (parseTime(timeslot.endTime) - parseTime(timeslot.startTime))
      );
      if (startIndex + requiredSlots - 1 >= sameDayTimeslots.length) continue;
      const selectedTimeslots = sameDayTimeslots.slice(
        startIndex,
        startIndex + requiredSlots
      );
      let totalDuration = 0;
      for (let i = 0; i < selectedTimeslots.length - 1; i++) {
        if (
          parseTime(selectedTimeslots[i].endTime) !==
          parseTime(selectedTimeslots[i + 1].startTime)
        ) {
          totalDuration = 0;
          break;
        }
        totalDuration += selectedTimeslots[i].duration;
      }
      if (totalDuration > 0) {
        totalDuration +=
          selectedTimeslots[selectedTimeslots.length - 1].duration;
      }
      if (totalDuration < sessionMinutes) continue;
      for (const room of rooms) {
        if (activity.roomRequirement && room.type !== activity.roomRequirement)
          continue;
        validOptions++;
      }
    }
    activityConstraints.push({
      activity,
      validOptions,
    });
  }
  activityConstraints.sort((a, b) => {
    if (a.validOptions !== b.validOptions)
      return a.validOptions - b.validOptions;
    return randomize ? Math.random() - 0.5 : 0;
  });
  return activityConstraints.map((ac) => ac.activity);
}

/*
 * Builds domains for each activity, listing valid timeslot-room assignments.
 * IMPORTANT: Empty domains indicate infeasible schedules; debug with logging if this occurs.
 */
async function buildDomains(
  activities,
  rooms,
  timeslots,
  schedule,
  lectureLoad,
  usedTimeslots,
  usedActivityTimeslots
) {
  const domains = {};
  for (const activity of activities) {
    const validAssignments = [];
    // Sort rooms for this activity and current schedule
    const sortedRooms = sortRooms(rooms, activity, schedule);
    for (const timeslot of timeslots) {
      for (const room of sortedRooms) {
        const validTimeslots = await isValidAssignment(
          activity,
          timeslot,
          room,
          schedule,
          lectureLoad,
          usedTimeslots,
          usedActivityTimeslots,
          timeslots
        );
        if (validTimeslots) {
          validAssignments.push({ timeslot, room, validTimeslots });
        }
      }
    }
    domains[activity._id] = validAssignments;
  }
  return domains;
}

/*
 * Implements backtracking with forward checking to assign timeslots and rooms.
 * Prunes domains for future activities to reduce search space.
 * IMPORTANT: Over-pruning can lead to false negatives; relax checks if scheduling fails repeatedly.
 */
async function backtrackForwardChecking(
  activities,
  rooms,
  timeslots,
  schedule,
  lectureLoad,
  usedTimeslots,
  usedActivityTimeslots,
  scheduledSessions,
  index,
  userId,
  domains
) {
  if (index >= activities.length) {
    return true;
  }
  const activity = activities[index];
  const sessionKey = `${activity.originalId || activity._id}`;
  const currentSessions = scheduledSessions.get(sessionKey) || 0;
  const maxSessions = activity.originalActivity ? 4 : 1;
  if (currentSessions >= maxSessions) {
    return await backtrackForwardChecking(
      activities,
      rooms,
      timeslots,
      schedule,
      lectureLoad,
      usedTimeslots,
      usedActivityTimeslots,
      scheduledSessions,
      index + 1,
      userId,
      domains
    );
  }

  const domain = domains[activity._id] || [];
  if (domain.length === 0) return false;

  shuffleArray(domain);

  for (const { timeslot, room, validTimeslots } of domain) {
    const totalDuration = activity.sessionDuration * 60;
    const entry = {
      activityData: activity,
      activityId: activity.originalId || activity._id,
      timeslot: timeslot._id,
      reservedTimeslots: validTimeslots.map((ts) => ts._id),
      totalDuration,
      room: room._id,
      studentGroup: activity.studentGroup,
      createdBy: userId,
    };
    schedule.push(entry);
    validTimeslots.forEach((ts) => {
      usedTimeslots.set(`${ts._id}-${room._id}`, activity._id);
    });
    const activityTimeslotKeys = validTimeslots.map(
      (ts) =>
        `${activity.originalId || activity._id}-${ts._id}-${
          activity.studentGroup?._id || "N/A"
        }`
    );
    activityTimeslotKeys.forEach((key) =>
      usedActivityTimeslots.set(key, room._id)
    );
    lectureLoad.set(
      activity.lecture._id.toString(),
      (lectureLoad.get(activity.lecture._id.toString()) || 0) +
        activity.sessionDuration
    );
    scheduledSessions.set(sessionKey, currentSessions + 1);

    // Forward checking: Prune domains for future activities
    const newDomains = JSON.parse(JSON.stringify(domains));
    for (let j = index + 1; j < activities.length; j++) {
      const nextActivity = activities[j];
      newDomains[nextActivity._id] = (
        newDomains[nextActivity._id] || []
      ).filter(({ timeslot: ts, room: r, validTimeslots: vts }) =>
        isValidAssignment(
          nextActivity,
          ts,
          r,
          schedule,
          lectureLoad,
          usedTimeslots,
          usedActivityTimeslots,
          timeslots
        )
      );
      if (newDomains[nextActivity._id].length === 0) {
        schedule.pop();
        validTimeslots.forEach((ts) => {
          usedTimeslots.delete(`${ts._id}-${room._id}`);
        });
        activityTimeslotKeys.forEach((key) =>
          usedActivityTimeslots.delete(key)
        );
        lectureLoad.set(
          activity.lecture._id.toString(),
          (lectureLoad.get(activity.lecture._id.toString()) || 0) -
            activity.sessionDuration
        );
        scheduledSessions.set(sessionKey, currentSessions);
        return false;
      }
    }

    if (
      await backtrackForwardChecking(
        activities,
        rooms,
        timeslots,
        schedule,
        lectureLoad,
        usedTimeslots,
        usedActivityTimeslots,
        scheduledSessions,
        index + 1,
        userId,
        newDomains
      )
    ) {
      return true;
    }

    // Backtrack: Undo assignment
    schedule.pop();
    validTimeslots.forEach((ts) => {
      usedTimeslots.delete(`${ts._id}-${room._id}`);
    });
    activityTimeslotKeys.forEach((key) => usedActivityTimeslots.delete(key));
    lectureLoad.set(
      activity.lecture._id.toString(),
      (lectureLoad.get(activity.lecture._id.toString()) || 0) -
        activity.sessionDuration
    );
    scheduledSessions.set(sessionKey, currentSessions);
  }

  return false;
}

/*
 * Main scheduling function to generate a conflict-free schedule for a semester.
 * Uses backtracking with forward checking to assign timeslots and rooms.
 * IMPORTANT: Deletes existing schedules for the semester before saving new ones.
 * IMPORTANT: No checks against existing schedules; ensure no concurrent runs to avoid overwrites.
 */
async function generateSchedule(semester, userId) {
  if (!semester) {
    throw new Error("Semester is required");
  }

  // Create a new worker
  const worker = new Worker(
    path.join(__dirname, "../workers/schedulerWorker.js")
  );
  const workerId = Date.now().toString();

  // Store worker info
  activeWorkers.set(workerId, {
    worker,
    status: "running",
    progress: 0,
    result: null,
    error: null,
    startTime: Date.now(),
  });

  // Handle worker messages
  worker.on("message", (message) => {
    const workerInfo = activeWorkers.get(workerId);
    if (workerInfo) {
      workerInfo.status = message.status;
      workerInfo.progress = message.progress;
      if (message.result) workerInfo.result = message.result;
      if (message.error) workerInfo.error = message.error;
    }
  });

  // Handle worker errors
  worker.on("error", (error) => {
    console.error(`Worker ${workerId} error:`, error);
    const workerInfo = activeWorkers.get(workerId);
    if (workerInfo) {
      workerInfo.status = "failed";
      workerInfo.error = error.message || "Worker error occurred";
    }
  });

  // Handle worker exit
  worker.on("exit", (code) => {
    console.log(`Worker ${workerId} exited with code ${code}`);
    const workerInfo = activeWorkers.get(workerId);
    if (workerInfo) {
      if (code !== 0) {
        workerInfo.status = "failed";
        workerInfo.error = `Worker stopped with exit code ${code}`;
      } else if (workerInfo.status === "running") {
        workerInfo.status = "completed";
      }
    }
  });

  // Start the worker
  try {
    worker.postMessage({ semester, userId });
  } catch (error) {
    console.error(`Error starting worker ${workerId}:`, error);
    worker.terminate();
    activeWorkers.delete(workerId);
    throw new Error("Failed to start schedule generation worker");
  }

  return { workerId };
}

// Add function to check worker status
async function checkWorkerStatus(workerId) {
  const workerInfo = activeWorkers.get(workerId);
  if (!workerInfo) {
    throw new Error("Worker not found");
  }

  // Check if worker has been running too long (e.g., 30 minutes)
  const MAX_RUNTIME = 30 * 60 * 1000; // 30 minutes in milliseconds
  if (
    workerInfo.status === "running" &&
    Date.now() - workerInfo.startTime > MAX_RUNTIME
  ) {
    workerInfo.status = "failed";
    workerInfo.error = "Worker exceeded maximum runtime";
    try {
      workerInfo.worker.terminate();
    } catch (error) {
      console.error(
        `Error terminating long-running worker ${workerId}:`,
        error
      );
    }
  }

  return {
    status: workerInfo.status,
    progress: workerInfo.progress,
    result: workerInfo.result,
    error: workerInfo.error,
  };
}

/*
 * Reschedules specific activities while keeping other schedules unchanged.
 * Useful for handling dropout scenarios or specific rescheduling needs.
 * @param {string} semester - The semester identifier
 * @param {string[]} activityIds - Array of activity IDs to regenerateSchedule
 * @param {string} userId - The user ID performing the rescheduling
 * @returns {Object} Grouped schedules with the rescheduled activities
 */
async function regenerateSchedule(semester, activityIds, userId) {
  const MAX_RETRIES = 30;

  if (!semester || !Array.isArray(activityIds) || activityIds.length === 0) {
    throw new Error("Semester and activity IDs array are required");
  }

  // Fetch existing schedules that should remain unchanged
  const existingSchedules = await Schedule.find({
    semester,
    activity: { $nin: activityIds },
  })
    .populate({
      path: "activity",
      populate: [
        { path: "course" },
        { path: "lecture" },
        { path: "studentGroup" },
      ],
    })
    .lean();

  // Fetch activities to be rescheduled
  const activitiesToReschedule = await Activity.find({
    _id: { $in: activityIds },
    semester,
    isDeleted: false,
  })
    .populate("course")
    .populate("lecture")
    .populate("studentGroup")
    .lean();

  if (!activitiesToReschedule.length) {
    throw new Error("No valid activities found for rescheduling");
  }

  // Validate that all activities have required fields
  for (const activity of activitiesToReschedule) {
    if (!activity.lecture?._id) {
      throw new Error(
        `Activity ${activity._id} is missing lecture information`
      );
    }
    if (!activity.studentGroup?._id) {
      throw new Error(
        `Activity ${activity._id} is missing student group information`
      );
    }
  }

  // Expand activities into sessions (similar to generateSchedule)
  const expandedActivities = [];
  activitiesToReschedule.forEach((activity) => {
    const sessions = Math.ceil(activity.totalDuration / activity.split);
    for (let i = 0; i < sessions; i++) {
      const remainingDuration = activity.totalDuration - i * activity.split;
      if (remainingDuration <= 0) break;
      let currentSessionDuration = Math.min(activity.split, remainingDuration);
      if (
        currentSessionDuration < activity.split &&
        expandedActivities.length > 0
      ) {
        expandedActivities[expandedActivities.length - 1].sessionDuration =
          expandedActivities[expandedActivities.length - 1].sessionDuration +
          currentSessionDuration;
        break;
      }
      if (currentSessionDuration > 0) {
        expandedActivities.push({
          ...activity,
          _id: `${activity._id}_${i}`,
          originalId: activity._id,
          originalActivity: activity,
          sessionDuration: currentSessionDuration,
        });
      }
    }
  });

  // Fetch rooms and timeslots
  const rooms = await Room.find({ active: true }).lean();
  const timeslots = await Timeslot.find({ isDeleted: false }).lean();
  const daysOrder = await getDynamicDays();

  // Create initial schedule state from existing schedules
  const initialSchedule = existingSchedules.map((schedule) => ({
    activityData: schedule.activity,
    activityId: schedule.activity._id,
    timeslot: schedule.reservedTimeslots[0],
    reservedTimeslots: schedule.reservedTimeslots,
    totalDuration: schedule.totalDuration,
    room: schedule.room,
    studentGroup: schedule.studentGroup,
    createdBy: schedule.createdBy,
  }));

  let attempt = 0;
  let schedule = [...initialSchedule];

  while (attempt < MAX_RETRIES) {
    console.log(`Rescheduling attempt ${attempt + 1} of ${MAX_RETRIES}`);

    const sortedActivities = await sortActivities(
      expandedActivities,
      rooms,
      timeslots,
      attempt > 0
    );

    schedule = [...initialSchedule]; // Reset to initial state but keep existing schedules
    const lectureLoad = new Map();
    const usedTimeslots = new Map();
    const usedActivityTimeslots = new Map();
    const scheduledSessions = new Map();

    // Initialize constraints from existing schedules
    initialSchedule.forEach((entry) => {
      entry.reservedTimeslots.forEach((tsId) => {
        usedTimeslots.set(`${tsId}-${entry.room}`, entry.activityId);
        const key = `${entry.activityId}-${tsId}-${
          entry.studentGroup?._id || "N/A"
        }`;
        usedActivityTimeslots.set(key, entry.room);
      });
      if (entry.activityData.lecture) {
        const currentLoad =
          lectureLoad.get(entry.activityData.lecture._id.toString()) || 0;
        lectureLoad.set(
          entry.activityData.lecture._id.toString(),
          currentLoad + (entry.activityData.sessionDuration || 0)
        );
      }
    });

    // Build domains for new activities
    const domains = await buildDomains(
      sortedActivities,
      rooms,
      timeslots,
      schedule,
      lectureLoad,
      usedTimeslots,
      usedActivityTimeslots
    );

    const found = await backtrackForwardChecking(
      sortedActivities,
      rooms,
      timeslots,
      schedule,
      lectureLoad,
      usedTimeslots,
      usedActivityTimeslots,
      scheduledSessions,
      0,
      userId,
      domains
    );

    if (!found) {
      console.log(`Attempt ${attempt + 1} failed: No valid schedule found`);
      attempt++;
      continue;
    }

    // Verify no conflicts with existing schedules
    const allSchedules = [
      ...initialSchedule,
      ...schedule.slice(initialSchedule.length),
    ];
    const timeslotGroups = {};
    allSchedules.forEach((entry) => {
      entry.reservedTimeslots.forEach((tsId) => {
        const key = `${entry.studentGroup?._id || "N/A"}-${tsId}`;
        if (!timeslotGroups[key]) timeslotGroups[key] = [];
        timeslotGroups[key].push({
          activityId: entry.activityId,
          timeslot: entry.timeslot,
          reservedTimeslots: entry.reservedTimeslots,
          room: entry.room,
          studentGroup: entry.studentGroup?._id,
        });
      });
    });

    const conflicts = Object.values(timeslotGroups)
      .filter((group) => group.length > 1)
      .map((group) => group);

    if (conflicts.length === 0) {
      // Save only the new schedules
      const newSchedulesToSave = schedule
        .slice(initialSchedule.length)
        .filter(
          (entry) =>
            entry.activityId &&
            entry.room &&
            entry.reservedTimeslots &&
            entry.reservedTimeslots.length > 0
        )
        .map((entry) => ({
          activity: entry.activityId,
          reservedTimeslots: entry.reservedTimeslots,
          totalDuration: entry.totalDuration,
          room: entry.room,
          studentGroup: entry.studentGroup?._id,
          createdBy: userId,
          semester,
        }));

      try {
        // Delete only the schedules for activities being rescheduled
        await Schedule.deleteMany({
          semester,
          activity: { $in: activityIds },
        });

        if (newSchedulesToSave.length > 0) {
          await Schedule.insertMany(newSchedulesToSave, { ordered: false });
        }
        console.log("Selected activities rescheduled successfully");
      } catch (error) {
        console.error("Error saving rescheduled activities:", error.stack);
        throw new Error(
          `Failed to save rescheduled activities: ${error.message}`
        );
      }

      // Return the complete updated schedule
      const updatedSchedules = await Schedule.find({ semester })
        .populate({
          path: "activity",
          populate: [
            { path: "course", select: "courseCode name" },
            { path: "lecture", select: "name maxLoad" },
            {
              path: "studentGroup",
              select: "department year section expectedEnrollment",
            },
            { path: "createdBy", select: "username name" },
          ],
        })
        .populate("room", "name capacity type building")
        .populate("reservedTimeslots", "day startTime endTime duration")
        .populate("studentGroup", "department year section expectedEnrollment")
        .populate("createdBy", "username name")
        .lean();

      const groupedSchedules = updatedSchedules.reduce((acc, entry) => {
        const groupId = entry.studentGroup?._id?.toString() || "unknown";
        if (!acc[groupId]) {
          acc[groupId] = {
            studentGroup: entry.studentGroup || {
              department: "Unknown",
              year: 0,
              section: "N/A",
              expectedEnrollment: 0,
            },
            entries: [],
          };
        }
        acc[groupId].entries.push({
          ...entry,
          activity: {
            ...entry.activity,
            semester: entry.semester || "Unknown",
          },
        });
        return acc;
      }, {});

      return groupedSchedules;
    }

    attempt++;
  }

  throw new Error(
    `Failed to regenerateSchedule activities after ${MAX_RETRIES} attempts. Conflicts detected.`
  );
}

module.exports = { generateSchedule, regenerateSchedule, checkWorkerStatus };
