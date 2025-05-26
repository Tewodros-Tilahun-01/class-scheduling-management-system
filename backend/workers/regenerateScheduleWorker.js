const { parentPort } = require("worker_threads");
const mongoose = require("mongoose");
const Activity = require("../models/Activity");
const Room = require("../models/Room");
const Timeslot = require("../models/Timeslot");
const Schedule = require("../models/Schedule");
const Course = require("../models/Course");
const Lecture = require("../models/Lectures");
const StudentGroup = require("../models/StudentGroup");
const User = require("../models/User");
require("../models/User");
const dotenv = require("dotenv");
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI).catch((err) => {
  console.error("MongoDB connection error:", err);
  process.exit(1);
});

// Utility functions
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + (minutes || 0);
}

async function getDynamicDays() {
  const timeslots = await Timeslot.find({ isDeleted: false }).lean();
  const days = [...new Set(timeslots.map((ts) => ts.day))].sort();
  return days;
}

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

async function isValidAssignmentSingleTimeslot(
  activity,
  timeslot,
  room,
  schedule,
  usedTimeslots,
  usedActivityTimeslots
) {
  if (activity.roomRequirement && room.type !== activity.roomRequirement) {
    return false;
  }
  const studentGroup = activity.studentGroup || {};
  const defaultEnrollment = 50;
  if (room.capacity < (studentGroup.expectedEnrollment || defaultEnrollment)) {
    return false;
  }

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

  for (let i = 0; i < selectedTimeslots.length - 1; i++) {
    const currentEnd = parseTime(selectedTimeslots[i].endTime);
    const nextStart = parseTime(selectedTimeslots[i + 1].startTime);
    if (currentEnd !== nextStart) {
      return false;
    }
  }

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
  const maxSessions = activity.originalActivity ? 30 : 1;
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

// Handle worker messages
parentPort.on("message", async (data) => {
  try {
    const { semester, userId, activityIds } = data;

    // Update progress to 5% - Initial setup
    parentPort.postMessage({ status: "running", progress: 5 });

    // Fetch existing schedules that should remain unchanged
    const existingSchedules = await Schedule.find({
      semester,
      activity: { $nin: activityIds },
      isDeleted: false,
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

    // Update progress to 10% - Existing schedules fetched
    parentPort.postMessage({ status: "running", progress: 10 });

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

    // Validate activities
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

    // Update progress to 20% - Activities validated
    parentPort.postMessage({ status: "running", progress: 20 });

    // Expand activities into sessions
    const expandedActivities = [];
    activitiesToReschedule.forEach((activity) => {
      const sessions = Math.ceil(activity.totalDuration / activity.split);
      for (let i = 0; i < sessions; i++) {
        const remainingDuration = activity.totalDuration - i * activity.split;
        if (remainingDuration <= 0) break;
        let currentSessionDuration = Math.min(
          activity.split,
          remainingDuration
        );
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

    // Update progress to 30% - Activities expanded
    parentPort.postMessage({ status: "running", progress: 30 });

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
    const MAX_RETRIES = 100;
    let schedule = [...initialSchedule];
    let pr = 30;

    // Retry scheduling up to MAX_RETRIES times
    while (attempt < MAX_RETRIES) {
      console.log(`Rescheduling attempt ${attempt + 1} of ${MAX_RETRIES}`);

      parentPort.postMessage({
        status: "running",
        progress: Math.min(95, pr),
      });
      pr += 2;

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

          // Fetch and group the updated schedules
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
            .populate(
              "studentGroup",
              "department year section expectedEnrollment"
            )
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

          // Update progress to 100% - Complete
          parentPort.postMessage({
            status: "completed",
            progress: 100,
            result: groupedSchedules,
          });

          // Close MongoDB connection and exit gracefully
          try {
            await mongoose.connection.close();
          } catch (err) {
            console.error("Error closing MongoDB connection:", err);
          }
          process.exit(0);
          return;
        } catch (error) {
          console.error("Error saving rescheduled activities:", error.stack);
          throw new Error(
            `Failed to save rescheduled activities: ${error.message}`
          );
        }
      }

      attempt++;
    }

    throw new Error(
      `Failed to regenerateSchedule activities after ${MAX_RETRIES} attempts. Conflicts detected.`
    );
  } catch (error) {
    console.error("Worker error:", error);
    parentPort.postMessage({
      status: "failed",
      error: error.message || "Unknown error occurred",
    });
    // Close MongoDB connection and exit with error code
    try {
      await mongoose.connection.close();
    } catch (err) {
      console.error("Error closing MongoDB connection:", err);
    }
    process.exit(1);
  }
});

// Handle worker termination
process.on("SIGTERM", async () => {
  try {
    await mongoose.connection.close();
  } catch (err) {
    console.error("Error closing MongoDB connection:", err);
  }
  process.exit(0);
});

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  parentPort.postMessage({
    status: "failed",
    error: error.message || "Unknown error occurred",
  });
  // Close MongoDB connection and exit with error code
  try {
    mongoose.connection.close();
  } catch (err) {
    console.error("Error closing MongoDB connection:", err);
  }
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  parentPort.postMessage({
    status: "failed",
    error: reason?.message || "Unknown error occurred",
  });
  // Close MongoDB connection and exit with error code
  try {
    mongoose.connection.close();
  } catch (err) {
    console.error("Error closing MongoDB connection:", err);
  }
  process.exit(1);
});
