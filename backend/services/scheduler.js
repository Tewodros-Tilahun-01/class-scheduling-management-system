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
  const days = [...new Set(timeslots.map((ts) => ts.day))].sort(); // Sort alphabetically or customize as needed
  return days;
}

function sortTimeslots(timeslots, schedule, daysOrder) {
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
    console.log(
      `Room ${room._id} type ${room.type} does not match requirement ${activity.roomRequirement} for activity ${activity._id}`
    );
    return false;
  }
  const studentGroup = activity.studentGroup || {};
  const defaultEnrollment = 50;
  if (room.capacity < (studentGroup.expectedEnrollment || defaultEnrollment)) {
    console.log(
      `Room ${room._id} capacity ${room.capacity} too low for enrollment ${
        studentGroup.expectedEnrollment || defaultEnrollment
      } for activity ${activity._id}`
    );
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
      console.log(
        `Room ${room._id} already booked for timeslot ${timeslot._id} for activity ${activity._id}`
      );
      return false;
    }
    if (
      entry.activityData.lecture._id.toString() ===
        activity.lecture._id.toString() &&
      timeslotsOverlap(entry.timeslot, timeslot)
    ) {
      console.log(
        `Lecture ${activity.lecture._id} conflict for timeslot ${timeslot._id} for activity ${activity._id}`
      );
      return false;
    }
    if (
      activity.studentGroup?._id &&
      entry.activityData.studentGroup?._id &&
      entry.activityData.studentGroup._id.toString() ===
        activity.studentGroup._id.toString() &&
      timeslotsOverlap(entry.timeslot, timeslot)
    ) {
      console.log(
        `Student group ${activity.studentGroup._id} conflict for timeslot ${timeslot._id} for activity ${activity._id}`
      );
      return false;
    }
  }
  const timeslotRoomKey = `${timeslot._id}-${room._id}`;
  if (usedTimeslots.has(timeslotRoomKey)) {
    console.log(
      `Timeslot ${timeslot._id} and room ${room._id} already used for activity ${activity._id}`
    );
    return false;
  }
  return true;
}

function isValidAssignment(
  activity,
  timeslot,
  room,
  schedule,
  lectureLoad,
  usedTimeslots
) {
  const sessionDurationHours = activity.sessionDuration;
  const minutesPerHour = 60;
  const sessionMinutes = sessionDurationHours * minutesPerHour;

  // Check if the single timeslot can cover the session duration
  const tsStart = parseTime(timeslot.startTime);
  const tsEnd = parseTime(timeslot.endTime);
  const tsDuration = tsEnd - tsStart;

  if (tsDuration < sessionMinutes) {
    console.log(
      `Timeslot ${timeslot._id} duration ${tsDuration} minutes is too short for ${sessionMinutes} minutes required by activity ${activity._id}`
    );
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
    console.log(
      `Lecture ${lectureId} load ${
        currentLoad + sessionDurationHours
      } exceeds maxLoad ${activity.lecture.maxLoad} for activity ${
        activity._id
      }`
    );
    return false;
  }

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

  return [timeslot];
}

async function sortActivities(activities, rooms, timeslots) {
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
    console.log("Successfully scheduled all activities");
    return true;
  }
  const activity = activities[index];
  console.log(
    `Attempting to schedule activity ${activity._id} (original: ${
      activity.originalId || activity._id
    })`
  );
  const sessionKey = `${activity.originalId || activity._id}`;
  const currentSessions = scheduledSessions.get(sessionKey) || 0;
  const maxSessions = activity.originalActivity
    ? Math.ceil(
        activity.originalActivity.totalDuration / activity.sessionDuration
      )
    : 1;
  if (currentSessions >= maxSessions) {
    console.log(
      `Activity ${activity._id} already has ${currentSessions} sessions, moving to next`
    );
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
        usedTimeslots
      );
      if (validTimeslots) {
        validAssignments.push({ timeslot, room, validTimeslots });
      }
    }
  }

  if (validAssignments.length === 0) {
    console.log(`No valid assignments found for activity ${activity._id}`);
  }

  shuffleArray(validAssignments);

  for (const { timeslot, room, validTimeslots } of validAssignments) {
    console.log(
      `Trying timeslot ${timeslot._id} and room ${room._id} for activity ${activity._id}`
    );
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

    console.log(
      `Backtracking: removing assignment for activity ${activity._id}`
    );
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

async function generateSchedule(semester, userId, sessionLength = 1) {
  if (!semester) {
    throw new Error("Semester is required");
  }
  if (sessionLength <= 0) {
    throw new Error("Session length must be positive");
  }

  console.log(
    `Fetching activities for semester ${semester} and user ${userId}`
  );
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

  console.log(`Found ${activities.length} activities`);
  activities.forEach((activity, index) => {
    console.log(`Validating activity ${activity._id} (index ${index})`);
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
  });

  const expandedActivities = [];
  activities.forEach((activity) => {
    const sessions = Math.ceil(activity.totalDuration / sessionLength);
    for (let i = 0; i < sessions; i++) {
      const remainingDuration = activity.totalDuration - i * sessionLength;
      if (remainingDuration <= 0) break;
      const currentSessionDuration = Math.min(sessionLength, remainingDuration);
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

  console.log(`Expanded to ${expandedActivities.length} activities`);
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

  console.log("Fetching rooms");
  const rooms = await Room.find({ active: true }).lean();
  console.log(`Found ${rooms.length} active rooms`);
  console.log("Fetching timeslots");
  const timeslots = await Timeslot.find().lean();
  console.log(`Found ${timeslots.length} timeslots`);
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

  console.log("Starting backtracking");
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
    console.error("Backtracking failed to find a valid schedule");
    throw new Error("Failed to generate a valid schedule");
  }

  console.log("Saving schedules");
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

  console.log("Fetching final schedules");
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
