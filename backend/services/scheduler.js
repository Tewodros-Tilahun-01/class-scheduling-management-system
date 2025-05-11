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

function sortTimeslots(timeslots, schedule) {
  const daysOrder = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const dayUsage = daysOrder.reduce((acc, day) => ({ ...acc, [day]: 0 }), {});
  schedule.forEach((entry) => {
    if (entry.timeslot && entry.timeslot.day) {
      dayUsage[entry.timeslot.day] = (dayUsage[entry.timeslot.day] || 0) + 1;
    }
  });
  const sorted = [...timeslots].sort((a, b) => {
    const dayA = daysOrder.indexOf(a.day);
    const dayB = daysOrder.indexOf(b.day);
    const usageA = dayUsage[a.day] || 0;
    const usageB = dayUsage[b.day] || 0;
    if (usageA !== usageB) return usageA - usageB;
    if (dayA !== dayB) return dayA - dayB;
    return parseTime(a.startTime) - parseTime(b.startTime);
  });
  // Introduce randomness: shuffle with 50% probability
  return Math.random() < 0.5 ? shuffleArray([...sorted]) : sorted;
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
  const sorted = filteredRooms.sort((a, b) => {
    const usageA = roomUsage[a._id.toString()] || 0;
    const usageB = roomUsage[b._id.toString()] || 0;
    if (usageA !== usageB) return usageA - usageB;
    if (a.capacity !== b.capacity) return a.capacity - b.capacity;
    return a._id.toString().localeCompare(b._id.toString());
  });
  // Introduce randomness: shuffle with 50% probability
  return Math.random() < 0.5 ? shuffleArray([...sorted]) : sorted;
}

function isValidAssignmentSingleTimeslot(
  activity,
  timeslot,
  room,
  schedule,
  usedTimeslots
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
  }
  const timeslotRoomKey = `${timeslot._id}-${room._id}`;
  if (usedTimeslots.has(timeslotRoomKey)) {
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
  allTimeslots
) {
  const sessionDurationHours = activity.sessionDuration;
  const minutesPerHour = 60;
  const sessionMinutes = sessionDurationHours * minutesPerHour;

  const startIndex = allTimeslots.findIndex(
    (ts) => ts._id.toString() === startTimeslot._id.toString()
  );
  if (startIndex === -1) return false;

  const requiredTimeslots = [];
  let currentTime = parseTime(startTimeslot.startTime);
  const endTime = currentTime + sessionMinutes;
  let i = startIndex;

  while (i < allTimeslots.length && currentTime < endTime) {
    const ts = allTimeslots[i];
    if (ts.day !== startTimeslot.day) {
      return false;
    }
    const tsStart = parseTime(ts.startTime);
    const tsEnd = parseTime(ts.endTime);
    if (tsStart !== currentTime) {
      return false;
    }
    requiredTimeslots.push(ts);
    currentTime = tsEnd;
    i++;
  }
  if (currentTime !== endTime) {
    return false;
  }

  const lectureId = activity.lecture?._id;
  if (!lectureId) {
    console.error("lecture ID is undefined for activity:", activity);
    return false;
  }
  const currentLoad = lectureLoad.get(lectureId.toString()) || 0;
  if (
    activity.lecture.maxLoad &&
    currentLoad + sessionDurationHours > activity.lecture.maxLoad
  ) {
    return false;
  }

  for (const timeslot of requiredTimeslots) {
    if (
      !isValidAssignmentSingleTimeslot(
        activity,
        timeslot,
        room,
        schedule,
        usedTimeslots
      )
    ) {
      return false;
    }
  }

  return requiredTimeslots;
}

async function sortActivities(activities, rooms, timeslots) {
  const activityConstraints = [];
  for (const activity of activities) {
    let validOptions = 0;
    for (let i = 0; i < timeslots.length; i++) {
      const startTimeslot = timeslots[i];
      const sessionDurationHours = activity.sessionDuration;
      let valid = true;
      let currentTime = parseTime(startTimeslot.startTime);
      const endTime = currentTime + sessionDurationHours * 60;
      let j = i;
      while (j < timeslots.length && currentTime < endTime) {
        if (
          timeslots[j].day !== startTimeslot.day ||
          parseTime(timeslots[j].startTime) !== currentTime
        ) {
          valid = false;
          break;
        }
        currentTime = parseTime(timeslots[j].endTime);
        j++;
      }
      if (currentTime !== endTime) {
        valid = false;
      }
      if (!valid) continue;
      for (const room of rooms) {
        if (activity.roomRequirement && room.type !== activity.roomRequirement)
          continue;
        validOptions++;
      }
    }
    // Add random factor to validOptions for sorting
    const randomFactor = Math.random() * 10; // Small random weight
    activityConstraints.push({
      activity,
      validOptions: validOptions + randomFactor,
    });
  }
  activityConstraints.sort((a, b) => a.validOptions - b.validOptions);
  return activityConstraints.map((ac) => ac.activity);
}

async function backtrack(
  activities,
  rooms,
  timeslots,
  schedule,
  lectureLoad,
  usedTimeslots,
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
    ? activity.originalActivity.split
    : 1;
  if (currentSessions >= maxSessions) {
    return await backtrack(
      activities,
      rooms,
      timeslots,
      schedule,
      lectureLoad,
      usedTimeslots,
      scheduledSessions,
      index + 1,
      userId
    );
  }

  const sortedTimeslots = sortTimeslots(timeslots, schedule);
  const sortedRooms = sortRooms(rooms, activity, schedule);

  // Collect all valid assignments
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
        timeslots
      );
      if (validTimeslots) {
        validAssignments.push({ timeslot, room, validTimeslots });
      }
    }
  }

  // Shuffle valid assignments to introduce randomness
  shuffleArray(validAssignments);

  for (const { timeslot, room, validTimeslots } of validAssignments) {
    const newEntries = [];
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
    lectureLoad.set(
      activity.lecture._id.toString(),
      (lectureLoad.get(activity.lecture._id.toString()) || 0) -
        activity.sessionDuration
    );
    scheduledSessions.set(sessionKey, currentSessions);
  }

  return false;
}

async function generateSchedule(semester, userId) {
  if (!semester) {
    throw new Error("Semester is required");
  }

  const activities = await Activity.find({ semester, createdBy: userId })
    .populate("course lecture studentGroup")
    .lean();
  if (activities.length === 0) {
    throw new Error("No activities found for the specified semester and user");
  }

  activities.forEach((activity, index) => {
    if (!activity.lecture) {
      throw new Error(
        `Activity ${activity._id} (index ${index}) has no lecture`
      );
    }
    if (!activity.studentGroup) {
      throw new Error(
        `Activity ${activity._id} (index ${index}) has no studentGroup`
      );
    }
    if (
      !activity.studentGroup.expectedEnrollment ||
      activity.studentGroup.expectedEnrollment <= 0
    ) {
      throw new Error(
        `Activity ${activity._id} (index ${index}) has invalid or missing studentGroup.expectedEnrollment`
      );
    }
    if (!activity.totalDuration || activity.totalDuration < 1) {
      throw new Error(
        `Activity ${activity._id} (index ${index}) has invalid totalDuration: ${activity.totalDuration}`
      );
    }
    if (!activity.split || activity.split < 1) {
      throw new Error(
        `Activity ${activity._id} (index ${index}) has invalid split: ${activity.split}`
      );
    }
    if (activity.split > activity.totalDuration) {
      throw new Error(
        `Activity ${activity._id} (index ${index}) has split (${activity.split}) exceeding totalDuration (${activity.totalDuration})`
      );
    }
  });

  const expandedActivities = [];
  activities.forEach((activity) => {
    const baseDuration = Math.floor(activity.totalDuration / activity.split);
    const remainder = activity.totalDuration % activity.split;
    for (let i = 0; i < activity.split; i++) {
      const sessionDuration =
        baseDuration + (i === activity.split - 1 ? remainder : 0);
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
    if (total !== originalActivity.totalDuration) {
      throw new Error(
        `Total duration mismatch for activity ${activity.originalId}: expected ${originalActivity.totalDuration}, got ${total}`
      );
    }
  });

  const rooms = await Room.find().lean();
  const timeslots = await Timeslot.find().lean();
  const sortedActivities = await sortActivities(
    expandedActivities,
    rooms,
    timeslots
  );

  timeslots.forEach((ts, index) => {
    if (!ts._id) {
      throw new Error(`Timeslot ${ts.day} ${ts.startTime} missing _id`);
    }
  });

  const schedule = [];
  const lectureLoad = new Map();
  const usedTimeslots = new Map();
  const scheduledSessions = new Map();

  const found = await backtrack(
    sortedActivities,
    rooms,
    timeslots,
    schedule,
    lectureLoad,
    usedTimeslots,
    scheduledSessions,
    0,
    userId
  );

  if (!found) {
    throw new Error("Failed to generate a valid schedule");
  }

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
    await Schedule.insertMany(schedulesToSave, {
      ordered: false,
    });
  } catch (error) {
    console.error("Error saving schedules:", error);
    throw new Error(`Failed to save schedules: ${error.message}`);
  }

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

module.exports = { generateSchedule };
