// Scheduling Logic
const Activity = require("../models/Activity");
const Room = require("../models/Room");
const Timeslot = require("../models/Timeslot");
const Schedule = require("../models/Schedule");

function timeslotsOverlap(ts1, ts2) {
  if (ts1.day !== ts2.day) return false;
  const start1 = parseTime(ts1.startTime);
  const end1 = parseTime(ts1.endTime);
  const start2 = parseTime(ts2.startTime);
  const end2 = parseTime(ts2.endTime);
  return start1 < end2 && start2 < end1;
}

function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
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
  const course = activity.course || {};
  const defaultEnrollment = 50;
  if (room.capacity < (course.expectedEnrollment || defaultEnrollment)) {
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
      entry.activityData.instructor._id.toString() ===
        activity.instructor._id.toString() &&
      timeslotsOverlap(entry.timeslot, timeslot)
    ) {
      return false;
    }
    if (
      entry.activityData.studentGroup?._id &&
      activity.studentGroup?._id &&
      entry.activityData.studentGroup._id.toString() ===
        activity.studentGroup._id.toString() &&
      timeslotsOverlap(entry.timeslot, timeslot)
    ) {
      return false;
    }
  }
  const timeslotRoomKey = `${timeslot._id}-${room._id}-${
    activity.originalId || activity._id
  }`;
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
  instructorLoad,
  usedTimeslots,
  allTimeslots
) {
  const sessionDurationHours = activity.sessionDuration;
  const minutesPerHour = 60;
  const sessionMinutes = sessionDurationHours * minutesPerHour;

  const startIndex = allTimeslots.findIndex(
    (ts) => ts._id.toString() === startTimeslot._id.toString()
  );
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

  const instructorId = activity.instructor?._id;
  if (!instructorId) {
    console.error("Instructor ID is undefined for activity:", activity);
    return false;
  }
  const currentLoad = instructorLoad.get(instructorId.toString()) || 0;
  if (
    activity.instructor.maxLoad &&
    currentLoad + sessionDurationHours > activity.instructor.maxLoad
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
    activityConstraints.push({ activity, validOptions });
  }
  activityConstraints.sort((a, b) => a.validOptions - b.validOptions);
  return activityConstraints.map((ac) => ac.activity);
}

function sortRooms(rooms, activity) {
  return [...rooms].sort((a, b) => {
    if (
      a.type === activity.roomRequirement &&
      b.type !== activity.roomRequirement
    )
      return -1;
    if (
      b.type === activity.roomRequirement &&
      a.type !== activity.roomRequirement
    )
      return 1;
    return a.capacity - b.capacity;
  });
}

function sortTimeslots(timeslots) {
  const daysOrder = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  return [...timeslots].sort((a, b) => {
    const dayA = daysOrder.indexOf(a.day);
    const dayB = daysOrder.indexOf(b.day);
    if (dayA !== dayB) return dayA - dayB;
    if (a.preferenceScore !== b.preferenceScore) {
      return b.preferenceScore - a.preferenceScore;
    }
    return parseTime(a.startTime) - parseTime(b.startTime);
  });
}

async function backtrack(
  activities,
  rooms,
  timeslots,
  schedule,
  instructorLoad,
  usedTimeslots,
  index,
  userId
) {
  if (index >= activities.length) {
    return true;
  }
  const activity = activities[index];
  const sortedRooms = sortRooms(rooms, activity);
  const sortedTimeslots = sortTimeslots(timeslots);

  for (const timeslot of sortedTimeslots) {
    for (const room of sortedRooms) {
      const validTimeslots = isValidAssignment(
        activity,
        timeslot,
        room,
        schedule,
        instructorLoad,
        usedTimeslots,
        timeslots
      );
      if (validTimeslots) {
        const entry = {
          activityData: activity,
          activityId: activity.originalId,
          timeslot: validTimeslots[0]._id,
          room: room._id,
          studentGroup: activity.studentGroup,
          createdBy: userId,
        };
        schedule.push(entry);
        usedTimeslots.set(
          `${entry.timeslot}-${room._id}-${
            activity.originalId || activity._id
          }`,
          activity._id
        );
        instructorLoad.set(
          activity.instructor._id.toString(),
          (instructorLoad.get(activity.instructor._id.toString()) || 0) +
            activity.sessionDuration
        );

        if (
          await backtrack(
            activities,
            rooms,
            timeslots,
            schedule,
            instructorLoad,
            usedTimeslots,
            index + 1,
            userId
          )
        ) {
          return true;
        }

        schedule.pop();
        usedTimeslots.delete(
          `${entry.timeslot}-${room._id}-${activity.originalId || activity._id}`
        );
        instructorLoad.set(
          activity.instructor._id.toString(),
          (instructorLoad.get(activity.instructor._id.toString()) || 0) -
            activity.sessionDuration
        );
      }
    }
  }
  return false;
}

function evaluateSchedule(schedule, rooms, timeslots, instructorLoad) {
  const roomsUsed = new Set(
    schedule.map((entry) => entry.room?.toString() || "")
  ).size;
  const timeslotsUsed = new Set(
    schedule.map((entry) => entry.timeslot?.toString() || "")
  ).size;
  const maxLoad =
    instructorLoad.size > 0 ? Math.max(...instructorLoad.values()) : 0;
  const minLoad =
    instructorLoad.size > 0 ? Math.min(...instructorLoad.values()) : 0;
  const loadBalance = maxLoad - minLoad;
  return roomsUsed * 1000 + timeslotsUsed * 100 + loadBalance * 10;
}

async function generateSchedule(semester, userId) {
  if (!semester) {
    throw new Error("Semester is required");
  }

  const activities = await Activity.find({ semester, createdBy: userId })
    .populate("course instructor studentGroup")
    .lean();
  if (activities.length === 0) {
    throw new Error("No activities found for the specified semester and user");
  }

  activities.forEach((activity, index) => {
    if (!activity.instructor) {
      throw new Error(
        `Activity ${activity._id} (index ${index}) has no instructor`
      );
    }
    if (!activity.studentGroup) {
      throw new Error(
        `Activity ${activity._id} (index ${index}) has no studentGroup`
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

  let bestSchedule = [];
  let bestScore = Infinity;
  const schedule = [];
  const instructorLoad = new Map();
  const usedTimeslots = new Map();

  console.log(semester);
  await Schedule.deleteMany({ semester });

  const found = await backtrack(
    sortedActivities,
    rooms,
    timeslots,
    schedule,
    instructorLoad,
    usedTimeslots,
    0,
    userId
  );

  if (found) {
    const scheduleToSave = schedule.map((entry) => ({
      activity: entry.activityId,
      timeslot: entry.timeslot,
      room: entry.room,
      studentGroup: entry.studentGroup?._id,
      createdBy: userId,
      semester, // Added semester field
    }));
    const savedEntries = await Schedule.insertMany(scheduleToSave, {
      ordered: false,
    });
    bestSchedule = savedEntries;
    bestScore = evaluateSchedule(schedule, rooms, timeslots, instructorLoad);

    const maxIterations = 5;
    for (let i = 0; i < maxIterations; i++) {
      const tempSchedule = [];
      const tempInstructorLoad = new Map();
      const tempUsedTimeslots = new Map();
      const shuffledRooms = [...rooms].sort(() => Math.random() - 0.5);
      const shuffledTimeslots = sortTimeslots([...timeslots]).sort(
        () => Math.random() - 0.5
      );
      if (
        await backtrack(
          sortedActivities,
          shuffledRooms,
          shuffledTimeslots,
          tempSchedule,
          tempInstructorLoad,
          tempUsedTimeslots,
          0,
          userId
        )
      ) {
        const score = evaluateSchedule(
          tempSchedule,
          rooms,
          timeslots,
          tempInstructorLoad
        );
        if (score < bestScore) {
          bestScore = score;
          bestSchedule = tempSchedule.map((entry) => ({
            activity: entry.activityId,
            timeslot: entry.timeslot,
            room: entry.room,
            studentGroup: entry.studentGroup?._id,
            createdBy: userId,
            semester, // Added semester field
          }));
        }
      }
    }
  }

  if (bestSchedule.length === 0) {
    throw new Error("Failed to generate a valid schedule");
  }

  await Schedule.deleteMany({ semester });
  const finalSchedules = await Schedule.insertMany(bestSchedule, {
    ordered: false,
  });

  const schedules = await Schedule.find({ semester })
    .populate({
      path: "activity",
      populate: [
        { path: "course", select: "courseCode name expectedEnrollment" },
        { path: "instructor", select: "name maxLoad" },
        { path: "studentGroup", select: "department year section" },
        { path: "createdBy", select: "username name" },
      ],
    })
    .populate("room", "name capacity type department")
    .populate("timeslot", "day startTime endTime preferenceScore")
    .populate("studentGroup", "department year section")
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
        },
        entries: [],
      };
    }
    acc[groupId].entries.push({
      ...entry,
      activity: {
        ...entry.activity,
        semester: entry.semester || "Unknown", // Use direct semester field
      },
    });
    return acc;
  }, {});

  return groupedSchedules;
}

module.exports = { generateSchedule };
