const Activity = require("../models/Activity");
const Room = require("../models/Room");
const Timeslot = require("../models/Timeslot");
const Schedule = require("../models/Schedule");

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
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + (minutes || 0);
}

async function getDynamicDays() {
  const timeslots = await Timeslot.find({
    isDeleted: false,
    isReserved: false,
  }).lean();
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
  if (timeslot.isReserved) {
    return false;
  }
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
  const sessionMinutes = activity.sessionDuration * 60;
  const timeslotDuration =
    parseTime(startTimeslot.endTime) - parseTime(startTimeslot.startTime);
  const requiredSlots = Math.ceil(sessionMinutes / timeslotDuration);

  const sameDayTimeslots = allTimeslots
    .filter((ts) => ts.day === startTimeslot.day && !ts.isReserved)
    .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));

  const startIndex = sameDayTimeslots.findIndex(
    (ts) => ts._id.toString() === startTimeslot._id.toString()
  );
  if (startIndex === -1) {
    console.error(`Start timeslot ${startTimeslot._id} not found`);
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
    totalDuration += selectedTimeslots[i].duration;
  }
  totalDuration += selectedTimeslots[selectedTimeslots.length - 1].duration;
  if (totalDuration < sessionMinutes) {
    return false;
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
      const sessionMinutes = activity.sessionDuration * 60;
      const sameDayTimeslots = timeslots
        .filter((ts) => ts.day === timeslot.day && !ts.isReserved)
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
    ? activity.split // Use split directly
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
    timeslots.filter((ts) => !ts.isReserved),
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
    const totalDuration = validTimeslots.reduce(
      (sum, ts) => sum + ts.duration,
      0
    );
    const entry = {
      activityData: activity,
      activityId: activity.originalId || activity._id,
      timeslot: timeslot._id, // First timeslot
      reservedTimeslots: validTimeslots.map((ts) => ts._id),
      totalDuration,
      room: room._id,
      studentGroup: activity.studentGroup,
      createdBy: userId,
    };
    schedule.push(entry);
    usedTimeslots.set(`${timeslot._id}-${room._id}`, activity._id);
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

    schedule.pop();
    usedTimeslots.delete(`${timeslot._id}-${room._id}`);
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

async function generateSchedule(semester, userId) {
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

  const sessionLength = 1;
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

  expandedActivities.forEach((activity) => {
    const total = expandedActivities
      .filter((a) => a.originalId === activity.originalId)
      .reduce((sum, a) => sum + a.sessionDuration * 60, 0);
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
  const timeslots = await Timeslot.find({
    isDeleted: false,
    isReserved: false,
  }).lean();

  timeslots.forEach((ts) => {
    if (!ts._id) {
      throw new Error(`Timeslot ${ts.day} ${ts.startTime} missing _id`);
    }
  });

  let attempt = 0;
  let conflicts = [];
  let schedule = [];

  while (attempt < MAX_RETRIES) {
    console.log(`Scheduling attempt ${attempt + 1} of ${MAX_RETRIES}`);

    const sortedActivities = await sortActivities(
      expandedActivities,
      rooms,
      timeslots,
      attempt > 0
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
      const schedulesToSave = schedule.map((entry) => ({
        activity: entry.activityId,
        timeslot: entry.timeslot,
        reservedTimeslots: entry.reservedTimeslots,
        totalDuration: entry.totalDuration,
        room: entry.room,
        studentGroup: entry.studentGroup?._id,
        createdBy: userId,
        semester,
      }));

      try {
        await Schedule.deleteMany({ semester });
        await Schedule.insertMany(schedulesToSave, { ordered: false });
        await Timeslot.updateMany(
          {
            _id: { $in: schedule.flatMap((entry) => entry.reservedTimeslots) },
          },
          { isReserved: true }
        );
        console.log("Schedule generated and saved successfully");
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
        .populate("timeslot", "day startTime endTime duration preferenceScore")
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
