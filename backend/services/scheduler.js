const Activity = require("../models/Activity");
const Room = require("../models/Room");
const Timeslot = require("../models/Timeslot");
const Schedule = require("../models/Schedule");
const Course = require("../models/Course");
const Instructor = require("../models/Instructor");

// Helper to check if two timeslots overlap
function timeslotsOverlap(ts1, ts2) {
  if (ts1.day !== ts2.day) return false;
  const start1 = parseTime(ts1.startTime);
  const end1 = parseTime(ts1.endTime);
  const start2 = parseTime(ts2.startTime);
  const end2 = parseTime(ts2.endTime);
  return start1 < end2 && start2 < end1;
}

// Parse time string (e.g., "09:00") to minutes for comparison
function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

// Check if assignment violates constraints
function isValidAssignment(
  activity,
  timeslot,
  room,
  schedule,
  instructorLoad,
  usedTimeslots
) {
  // Room type constraint
  if (activity.roomRequirement && room.type !== activity.roomRequirement) {
    return false;
  }

  // Room capacity constraint
  const course = activity.course;
  const defaultEnrollment = 50; // Configurable default
  if (room.capacity < (course.expectedEnrollment || defaultEnrollment)) {
    return false;
  }

  // Instructor load constraint
  const currentLoad =
    instructorLoad.get(activity.instructor._id.toString()) || 0;
  if (
    activity.instructor.maxLoad &&
    currentLoad + activity.duration > activity.instructor.maxLoad
  ) {
    return false;
  }

  // Conflict check: room and instructor availability
  for (const entry of schedule) {
    if (
      entry.room.toString() === room._id.toString() &&
      timeslotsOverlap(entry.timeslot, timeslot)
    ) {
      return false; // Room occupied
    }
    if (
      entry.activity.instructor.toString() ===
        activity.instructor._id.toString() &&
      timeslotsOverlap(entry.timeslot, timeslot)
    ) {
      return false; // Instructor busy
    }
  }

  // Check global usedTimeslots for room conflicts
  const timeslotRoomKey = `${timeslot._id}-${room._id}`;
  if (usedTimeslots.has(timeslotRoomKey)) {
    return false; // Room already used
  }

  // Student group conflict
  for (const entry of schedule) {
    if (
      entry.activity.studentGroup &&
      activity.studentGroup &&
      entry.activity.studentGroup.toString() ===
        activity.studentGroup.toString() &&
      timeslotsOverlap(entry.timeslot, timeslot)
    ) {
      return false;
    }
  }

  return true;
}

// Heuristic: Sort activities by number of valid assignments
async function sortActivities(activities, rooms, timeslots) {
  const activityConstraints = [];
  for (const activity of activities) {
    let validOptions = 0;
    for (const timeslot of timeslots) {
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

// Heuristic: Sort rooms by capacity
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

// Heuristic: Sort timeslots by preference score
function sortTimeslots(timeslots) {
  return [...timeslots].sort((a, b) => b.preferenceScore - a.preferenceScore);
}

// Recursive backtracking function
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
    return true; // Solution found
  }

  const activity = activities[index];
  const sortedRooms = sortRooms(rooms, activity);
  const sortedTimeslots = sortTimeslots(timeslots);

  for (const timeslot of sortedTimeslots) {
    for (const room of sortedRooms) {
      if (
        isValidAssignment(
          activity,
          timeslot,
          room,
          schedule,
          instructorLoad,
          usedTimeslots
        )
      ) {
        // Make assignment
        const entry = new Schedule({
          activity: activity.originalId,
          timeslot: timeslot._id,
          room: room._id,
          studentGroup: activity.studentGroup,
          createdBy: userId, // Store user who generated the schedule
        });
        schedule.push(entry);
        instructorLoad.set(
          activity.instructor._id.toString(),
          (instructorLoad.get(activity.instructor._id.toString()) || 0) +
            activity.duration
        );
        usedTimeslots.set(`${timeslot._id}-${room._id}`, activity._id);

        // Recurse
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

        // Backtrack: undo assignment
        schedule.pop();
        instructorLoad.set(
          activity.instructor._id.toString(),
          (instructorLoad.get(activity.instructor._id.toString()) || 0) -
            activity.duration
        );
        usedTimeslots.delete(`${timeslot._id}-${room._id}`);
      }
    }
  }

  return false; // No valid assignment found
}

// Optimization: Evaluate schedule quality
function evaluateSchedule(schedule, rooms, timeslots, instructorLoad) {
  const roomsUsed = new Set(schedule.map((entry) => entry.room.toString()))
    .size;
  const timeslotsUsed = new Set(
    schedule.map((entry) => entry.timeslot.toString())
  ).size;
  const maxLoad =
    instructorLoad.size > 0 ? Math.max(...instructorLoad.values()) : 0;
  const minLoad =
    instructorLoad.size > 0 ? Math.min(...instructorLoad.values()) : 0;
  const loadBalance = maxLoad - minLoad;

  return roomsUsed * 1000 + timeslotsUsed * 100 + loadBalance * 10;
}

// Main scheduling function
async function generateSchedule(semester, userId) {
  // Fetch all activities for the semester and user
  const activities = await Activity.find({ semester, createdBy: userId })
    .populate("course instructor studentGroup")
    .lean();

  if (activities.length === 0) {
    throw new Error("No activities found for the specified semester and user");
  }

  // Replicate activities based on frequencyPerWeek
  const expandedActivities = [];
  activities.forEach((activity) => {
    for (let i = 0; i < activity.frequencyPerWeek; i++) {
      expandedActivities.push({
        ...activity,
        _id: `${activity._id}_${i}`,
        originalId: activity._id,
      });
    }
  });

  // Fetch rooms and timeslots
  const rooms = await Room.find().lean();
  const timeslots = await Timeslot.find().lean();

  // Sort activities by constraints
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

  // Delete existing schedules for the semester and user
  await Schedule.deleteMany({
    createdBy: userId,
    "activity.semester": semester,
  });

  // Try to find a valid schedule
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
    // Save schedule to database
    const savedEntries = await Schedule.insertMany(schedule);
    bestSchedule = savedEntries;
    bestScore = evaluateSchedule(schedule, rooms, timeslots, instructorLoad);

    // Try to optimize by exploring alternative schedules
    const maxIterations = 5;
    for (let i = 0; i < maxIterations; i++) {
      const tempSchedule = [];
      const tempInstructorLoad = new Map();
      const tempUsedTimeslots = new Map();
      const shuffledRooms = [...rooms].sort(() => Math.random() - 0.5);
      const shuffledTimeslots = [...timeslots].sort(() => Math.random() - 0.5);
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
          bestSchedule = tempSchedule;
          await Schedule.deleteMany({
            createdBy: userId,
            "activity.semester": semester,
          });
          bestSchedule = await Schedule.insertMany(tempSchedule);
        }
      }
    }
  } else {
    throw new Error("Unable to generate a valid schedule for the activities");
  }

  // Group schedule by student group for response
  const schedulesByGroup = bestSchedule.reduce((acc, entry) => {
    const groupId = entry.studentGroup?.toString() || "unknown";
    if (!acc[groupId]) {
      acc[groupId] = {
        studentGroup:
          activities.find((a) => a.studentGroup._id.toString() === groupId)
            ?.studentGroup || {},
        entries: [],
      };
    }
    acc[groupId].entries.push(entry);
    return acc;
  }, {});

  return schedulesByGroup;
}

module.exports = { generateSchedule };
