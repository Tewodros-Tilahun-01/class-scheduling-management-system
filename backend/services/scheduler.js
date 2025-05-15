const Activity = require("../models/Activity");
const Room = require("../models/Room");
const Timeslot = require("../models/Timeslot");
const Schedule = require("../models/Schedule");

// Utility function to shuffle an array (Fisher-Yates shuffle)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function timeslotsOverlap(ts1, ts2) {
  if (ts1.day !== ts2.day) return false;
  const start1 = parseTime(ts1.startTime);
  const end1 = parseTime(ts1.endTime);
  const start2 = parseTime(ts2.startTime);
  const end2 = parseTime(ts2.endTime);
  return start1 < end2 && start2 < end1;
}

function parseTime(timeStr) {
  let [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

async function getDynamicDays() {
  const timeslots = await Timeslot.find().lean();
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

function isValidAssignmentSingleTimeslot(
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
      timeslotsOverlap(entry.timeslot, timeslot)
    ) {
      return false;
    }
    if (
      entry.activityData.lecture._id.toString() ===
        activity.lecture._id.toString() &&
      timeslotsOverlap(entry.timeslot, timeslot)
    ) {
      return false;
    }
    if (
      activity.studentGroup?._id &&
      entry.activityData.studentGroup?._id &&
      entry.activityData.studentGroup._id.toString() ===
        activity.studentGroup._id.toString() &&
      timeslotsOverlap(entry.timeslot, timeslot)
    ) {
      return false;
    }
    if (
      (entry.activityData.originalId || entry.activityData._id).toString() ===
        (activity.originalId || activity._id).toString() &&
      timeslotsOverlap(entry.timeslot, timeslot)
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

function isValidAssignment(
  activity,
  startTimeslot,
  room,
  schedule,
  lectureLoad,
  usedTimeslots,
  usedActivityTimeslots,
  allTimeslots
) {
  const sessionDurationHours = activity.sessionDuration;
  const minutesPerHour = 60;
  const sessionMinutes = sessionDurationHours * minutesPerHour;
  const timeslotDuration =
    parseTime(startTimeslot.endTime) - parseTime(startTimeslot.startTime);
  const requiredSlots = Math.ceil(sessionMinutes / timeslotDuration);

  const sameDayTimeslots = allTimeslots
    .filter((ts) => ts.day === startTimeslot.day)
    .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));

  const startIndex = sameDayTimeslots.findIndex(
    (ts) => ts._id.toString() === startTimeslot._id.toString()
  );
  if (startIndex === -1) {
    console.error(`Start timeslot ${startTimeslot._id} not found in timeslots`);
    return false;
  }

  if (startIndex + requiredSlots - 1 >= sameDayTimeslots.length) {
    return false;
  }

  const selectedTimeslots = sameDayTimeslots.slice(
    startIndex,
    startIndex + requiredSlots
  );

  let totalDuration = 0;
  for (let i = 0; i < selectedTimeslots.length - 1; i++) {
    const currentEnd = parseTime(selectedTimeslots[i].endTime);
    const nextStart = parseTime(selectedTimeslots[i + 1].startTime);
    if (currentEnd !== nextStart) {
      return false;
    }
    totalDuration +=
      parseTime(selectedTimeslots[i].endTime) -
      parseTime(selectedTimeslots[i].startTime);
  }
  totalDuration +=
    parseTime(selectedTimeslots[selectedTimeslots.length - 1].endTime) -
    parseTime(selectedTimeslots[selectedTimeslots.length - 1].startTime);
  if (totalDuration < sessionMinutes) {
    return false;
  }

  const lectureId = activity.lecture?._id;
  if (!lectureId) {
    console.error("Lecture ID is undefined for activity:", activity);
    return false;
  }
  const currentLoad = lectureLoad.get(lectureId.toString()) || 0;
  if (
    activity.lecture.maxLoad &&
    currentLoad + sessionDurationHours > activity.lecture.maxLoad
  ) {
    return false;
  }

  for (const timeslot of selectedTimeslots) {
    if (
      !isValidAssignmentSingleTimeslot(
        activity,
        timeslot,
        room,
        schedule,
        usedTimeslots,
        usedActivityTimeslots
      )
    ) {
      return false;
    }
  }

  return selectedTimeslots;
}

async function sortActivities(activities, rooms, timeslots, randomize = false) {
  const activityConstraints = [];
  for (const activity of activities) {
    let validOptions = 0;
    for (const timeslot of timeslots) {
      const sessionDurationHours = activity.sessionDuration;
      const tsStart = parseTime(timeslot.startTime);
      const tsEnd = parseTime(timeslot.endTime);
      const tsDuration = tsEnd - tsStart;
      if (tsDuration < sessionDurationHours * 60) continue;
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
  // Sort by valid options (ascending), with randomization for ties if requested
  activityConstraints.sort((a, b) => {
    if (a.validOptions !== b.validOptions)
      return a.validOptions - b.validOptions;
    return randomize ? Math.random() - 0.5 : 0;
  });
  return activityConstraints.map((ac) => ac.activity);
}

async function backtrack(
  activities,
  rooms,
  timeslots,
  schedule,
  lectureLoad,
  usedTimeslots,
  usedActivityTimeslots,
  scheduledSessions,
  index,
  userId
) {
  if (index >= activities.length) {
    return true;
  }
  const activity = activities[index];
  const sessionKey = `${activity.originalId || activity._id}`;
  const currentSessions = scheduledSessions.get(sessionKey) || 0;
  const maxSessions = activity.originalActivity
    ? Math.ceil(
        activity.originalActivity.totalDuration / activity.sessionDuration
      )
    : 1;
  if (currentSessions >= maxSessions) {
    return await backtrack(
      activities,
      rooms,
      timeslots,
      schedule,
      lectureLoad,
      usedTimeslots,
      usedActivityTimeslots,
      scheduledSessions,
      index + 1,
      userId
    );
  }

  const sortedTimeslots = sortTimeslots(
    timeslots,
    schedule,
    await getDynamicDays()
  );
  const sortedRooms = sortRooms(rooms, activity, schedule);

  const validAssignments = [];
  for (const timeslot of sortedTimeslots) {
    for (const room of sortedRooms) {
      const validTimeslots = isValidAssignment(
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

  if (validAssignments.length === 0) {
    return false;
  }

  shuffleArray(validAssignments);

  for (const { timeslot, room, validTimeslots } of validAssignments) {
    const newEntries = [];
    const newActivityTimeslots = [];
    for (const validTimeslot of validTimeslots) {
      const entry = {
        activityData: activity,
        activityId: activity.originalId || activity._id,
        timeslot: validTimeslot._id,
        room: room._id,
        studentGroup: activity.studentGroup,
        createdBy: userId,
      };
      schedule.push(entry);
      newEntries.push(entry);
      usedTimeslots.set(`${validTimeslot._id}-${room._id}`, activity._id);
      const activityTimeslotKey = `${activity.originalId || activity._id}-${
        validTimeslot._id
      }-${activity.studentGroup?._id || "N/A"}`;
      usedActivityTimeslots.set(activityTimeslotKey, room._id);
      newActivityTimeslots.push(activityTimeslotKey);
    }
    lectureLoad.set(
      activity.lecture._id.toString(),
      (lectureLoad.get(activity.lecture._id.toString()) || 0) +
        activity.sessionDuration
    );
    scheduledSessions.set(sessionKey, currentSessions + 1);

    if (
      await backtrack(
        activities,
        rooms,
        timeslots,
        schedule,
        lectureLoad,
        usedTimeslots,
        usedActivityTimeslots,
        scheduledSessions,
        index + 1,
        userId
      )
    ) {
      return true;
    }

    for (let i = 0; i < newEntries.length; i++) {
      schedule.pop();
    }
    for (const validTimeslot of validTimeslots) {
      usedTimeslots.delete(`${validTimeslot._id}-${room._id}`);
    }
    for (const activityTimeslotKey of newActivityTimeslots) {
      usedActivityTimeslots.delete(activityTimeslotKey);
    }
    lectureLoad.set(
      activity.lecture._id.toString(),
      (lectureLoad.get(activity.lecture._id.toString()) || 0) -
        activity.sessionDuration
    );
    scheduledSessions.set(sessionKey, currentSessions);
  }

  return false;
}

async function generateSchedule(semester, userId, sessionLength = 2) {
  const MAX_RETRIES = 5;

  if (!semester) {
    throw new Error("Semester is required");
  }

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

  const expandedActivities = [];
  activities.forEach((activity) => {
    const baseDuration = activity.split || sessionLength;
    const totalDuration = activity.totalDuration;
    const numSessions = Math.ceil(totalDuration / baseDuration);

    for (let i = 0; i < numSessions; i++) {
      const sessionDuration = Math.min(
        baseDuration,
        totalDuration - i * baseDuration
      );
      if (sessionDuration > 0) {
        expandedActivities.push({
          ...activity,
          _id: `${activity._id}_${i}`,
          originalId: activity._id,
          originalActivity: activity,
          sessionDuration,
        });
      }
    }
  });

  expandedActivities.forEach((activity) => {
    const total = expandedActivities
      .filter((a) => a.originalId === activity.originalId)
      .reduce((sum, a) => sum + a.sessionDuration, 0);
    const originalActivity = activities.find(
      (a) => a._id.toString() === activity.originalId.toString()
    );
    if (Math.abs(total - originalActivity.totalDuration) > 0.01) {
      throw new Error(
        `Total duration mismatch for activity ${activity.originalId}: expected ${originalActivity.totalDuration}, got ${total}`
      );
    }
  });

  const rooms = await Room.find({ active: true }).lean();
  const timeslots = await Timeslot.find({ isDeleted: false }).lean();

  timeslots.forEach((ts, index) => {
    if (!ts._id) {
      throw new Error(`Timeslot ${ts.day} ${ts.startTime} missing _id`);
    }
  });

  let attempt = 0;
  let conflicts = [];
  let schedule = [];

  while (attempt < MAX_RETRIES) {
    console.log(`Scheduling attempt ${attempt + 1} of ${MAX_RETRIES}`);

    // Randomize activity sorting for retries (except first attempt)
    const sortedActivities = await sortActivities(
      expandedActivities,
      rooms,
      timeslots,
      attempt > 0 // Randomize on retries
    );

    schedule = [];
    const lectureLoad = new Map();
    const usedTimeslots = new Map();
    const usedActivityTimeslots = new Map();
    const scheduledSessions = new Map();

    const found = await backtrack(
      sortedActivities,
      rooms,
      timeslots,
      schedule,
      lectureLoad,
      usedTimeslots,
      usedActivityTimeslots,
      scheduledSessions,
      0,
      userId
    );

    if (!found) {
      console.log(`Attempt ${attempt + 1} failed: No valid schedule found`);
      attempt++;
      continue;
    }

    // Validate for conflicts
    const timeslotGroups = {};
    schedule.forEach((entry) => {
      const key = `${entry.studentGroup?._id || "N/A"}-${entry.timeslot}`;
      if (!timeslotGroups[key]) timeslotGroups[key] = [];
      timeslotGroups[key].push({
        activityId: entry.activityId,
        timeslot: entry.timeslot,
        room: entry.room,
        studentGroup: entry.studentGroup?._id,
      });
    });
    conflicts = Object.values(timeslotGroups)
      .filter((group) => group.length > 1)
      .map((group) => group);

    if (conflicts.length === 0) {
      // Success: Save the schedule
      const schedulesToSave = schedule.map((entry) => ({
        activity: entry.activityId,
        timeslot: entry.timeslot,
        room: entry.room,
        studentGroup: entry.studentGroup?._id,
        createdBy: userId,
        semester,
      }));

      try {
        await Schedule.deleteMany({ semester });
        await Schedule.insertMany(schedulesToSave, { ordered: false });
        console.log("Schedule generated and saved successfully");
      } catch (error) {
        console.error("Error saving schedules:", error);
        throw new Error(`Failed to save schedules: ${error.message}`);
      }

      // Return grouped schedules
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
        .populate("timeslot", "day startTime endTime preferenceScore")
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

  // Max retries reached
  const errorMessage = `Failed to generate schedule after ${MAX_RETRIES} attempts. Conflicts detected: ${JSON.stringify(
    conflicts,
    null,
    2
  )}`;
  console.error(errorMessage);
  throw new Error(errorMessage);
}

module.exports = { generateSchedule };
