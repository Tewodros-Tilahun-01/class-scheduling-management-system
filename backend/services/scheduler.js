const Activity = require("../models/Activity");
const Room = require("../models/Room");
const Timeslot = require("../models/Timeslot");
const Schedule = require("../models/Schedule");
require("../models/User");

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

/**
 * Sorts timeslots to balance usage across days and prioritize earlier times.
 * Uses day usage count and day order to minimize overbooking on specific days.
 */
function sortTimeslots(timeslots, schedule, daysOrder) {
  const dayUsage = daysOrder.reduce((acc, day) => ({ ...acc, [day]: 0 }), {});
  schedule.forEach((entry) => {
    if (entry.timeslot && entry.timeslot.day) {
      dayUsage[entry.timeslot.day] = (dayUsage[entry.timeslot.day] || 0) + 1;
    }
  });
  return [...timeslots].sort((a, b) => {
    const dayA = daysOrder.indexOf(a.day);
    const dayB = daysOrder.indexOf(b.day);
    const usageA = dayUsage[a.day] || 0;
    const usageB = dayUsage[b.day] || 0;
    if (usageA !== usageB) return usageA - usageB;
    if (dayA !== dayB) return dayA - dayB;
    return parseTime(a.startTime) - parseTime(b.startTime);
  });
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
      entry.reservedTimeslots.some((tsId) => timeslot._id.equals(tsId))
    ) {
      return false;
    }
    if (
      entry.activityData.lecture._id.toString() ===
        activity.lecture._id.toString() &&
      entry.reservedTimeslots.some((tsId) => timeslot._id.equals(tsId))
    ) {
      return false;
    }
    if (
      activity.studentGroup?._id &&
      entry.activityData.studentGroup?._id &&
      entry.activityData.studentGroup._id.toString() ===
        activity.studentGroup._id.toString() &&
      entry.reservedTimeslots.some((tsId) => timeslot._id.equals(tsId))
    ) {
      return false;
    }
    if (
      (entry.activityData.originalId || entry.activityData._id).toString() ===
        (activity.originalId || activity._id).toString() &&
      entry.reservedTimeslots.some((tsId) => timeslot._id.equals(tsId))
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
  const MAX_RETRIES = 8;

  if (!semester) {
    throw new Error("Semester is required");
  }

  // Fetch activities for the semester and user
  const activities = await Activity.find({
    semester,
    createdBy: userId,
    isDeleted: false,
  })
    .populate("course lecture studentGroup")
    .lean();
  if (activities.length === 0) {
    throw new Error("No activities found for the specified semester and user");
  }

  // Expand activities into sessions based on totalDuration and split
  const expandedActivities = [];
  activities.forEach((activity) => {
    if (!activity._id) {
      throw new Error(`Missing _id for activity`);
    }
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

  if (expandedActivities.length === 0) {
    throw new Error("No valid activities to expand");
  }

  // Validate total duration of expanded sessions
  expandedActivities.forEach((activity) => {
    const total = expandedActivities
      .filter((a) => a.originalId === activity.originalId)
      .reduce((sum, a) => sum + a.sessionDuration, 0);
    const originalActivity = activities.find(
      (a) => a._id.toString() === activity.originalId.toString()
    );
    if (!originalActivity) {
      throw new Error(`Original activity not found for ${activity.originalId}`);
    }
    if (Math.abs(total - originalActivity.totalDuration) > 0.01) {
      throw new Error(
        `Total duration mismatch for activity ${activity.originalId}: expected ${originalActivity.totalDuration}, got ${total}`
      );
    }
  });

  // Fetch rooms and timeslots
  const rooms = await Room.find({ active: true }).lean();
  const timeslots = await Timeslot.find({ isDeleted: false }).lean();

  // Validate timeslot IDs
  timeslots.forEach((ts) => {
    if (!ts._id) {
      throw new Error(`Timeslot ${ts.day} ${ts.startTime} missing _id`);
    }
  });

  // --- INTEGRATION OF SORTING FUNCTIONS ---
  // Get dynamic days for consistent ordering
  const daysOrder = await getDynamicDays();

  // Sort timeslots for balanced day usage and earlier times
  const sortedTimeslots = sortTimeslots(timeslots, [], daysOrder);

  let attempt = 0;
  let conflicts = [];
  let schedule = [];

  // Retry scheduling up to MAX_RETRIES times
  while (attempt < MAX_RETRIES) {
    console.log(`Scheduling attempt ${attempt + 1} of ${MAX_RETRIES}`);

    // For each activity, sort rooms for that activity and use sortedTimeslots
    // Optionally, you can pass sortedRooms and sortedTimeslots to sortActivities/buildDomains if needed

    const sortedActivities = await sortActivities(
      expandedActivities,
      rooms,
      sortedTimeslots,
      attempt > 0
    );

    schedule = [];
    const lectureLoad = new Map();
    const usedTimeslots = new Map();
    const usedActivityTimeslots = new Map();
    const scheduledSessions = new Map();

    // Build domains using sortedTimeslots and sorted rooms for each activity
    const domains = await buildDomains(
      sortedActivities,
      rooms,
      sortedTimeslots,
      schedule,
      lectureLoad,
      usedTimeslots,
      usedActivityTimeslots
    );

    const found = await backtrackForwardChecking(
      sortedActivities,
      rooms,
      sortedTimeslots,
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

    // Check for student group conflicts in the schedule
    const timeslotGroups = {};
    schedule.forEach((entry) => {
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
    conflicts = Object.values(timeslotGroups)
      .filter((group) => group.length > 1)
      .map((group) => group);

    if (conflicts.length === 0) {
      const schedulesToSave = schedule
        .filter(
          (entry) =>
            entry.activityId &&
            entry.room &&
            entry.reservedTimeslots &&
            entry.reservedTimeslots.length > 0
        )
        .map((entry) => {
          // Populate and sort reservedTimeslots by start time
          const populatedTimeslots = entry.reservedTimeslots
            .map((tsId) =>
              timeslots.find((ts) => ts._id.toString() === tsId.toString())
            )
            .filter(Boolean)
            .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime))
            .map((ts) => ts._id);

          return {
            activity: entry.activityId,
            reservedTimeslots: populatedTimeslots,
            totalDuration: entry.totalDuration,
            room: entry.room,
            studentGroup: entry.studentGroup?._id,
            createdBy: userId,
            semester,
          };
        });

      try {
        console.log(schedule);
        // IMPORTANT: Deletes all existing schedules for the semester, preventing conflicts but risking data loss if not intended.
        await Schedule.deleteMany({ semester });
        await Schedule.insertMany(schedulesToSave, { ordered: false });
        console.log("Schedule generated and saved successfully");
      } catch (error) {
        console.error("Error saving schedules:", error.stack);
        throw new Error(`Failed to save schedules: ${error.message}`);
      }

      // Fetch and group the saved schedules for return
      const schedules = await Schedule.find({ semester })
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

      const groupedSchedules = schedules.reduce((acc, entry) => {
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
    `Failed to generate schedule after ${MAX_RETRIES} attempts. Conflicts detected.`
  );
}

module.exports = { generateSchedule };
