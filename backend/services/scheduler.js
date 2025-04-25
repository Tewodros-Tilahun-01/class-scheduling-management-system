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

  // Room capacity constraint (assuming course has expected enrollment)
  const course = activity.course;
  if (room.capacity < (course.expectedEnrollment || 50)) {
    return false;
  }

  // Instructor load constraint
  const currentLoad = instructorLoad.get(activity.instructor._id) || 0;
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

  // Student group conflict (same student group can't have overlapping activities)
  for (const entry of schedule) {
    if (
      entry.activity.studentGroup === activity.studentGroup &&
      timeslotsOverlap(entry.timeslot, timeslot)
    ) {
      return false;
    }
  }

  return true;
}

// Heuristic: Sort activities by number of valid assignments (most constrained first)
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

// Heuristic: Sort rooms by capacity (ascending) to minimize room usage
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

// Heuristic: Sort timeslots by preference score (descending)
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
  index
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
        });
        schedule.push(entry);
        instructorLoad.set(
          activity.instructor._id,
          (instructorLoad.get(activity.instructor._id) || 0) + activity.duration
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
            index + 1
          )
        ) {
          return true;
        }

        // Backtrack: undo assignment
        schedule.pop();
        instructorLoad.set(
          activity.instructor._id,
          (instructorLoad.get(activity.instructor._id) || 0) - activity.duration
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
  const maxLoad = Math.max(...instructorLoad.values());
  const minLoad = Math.min(...instructorLoad.values());
  const loadBalance = maxLoad - minLoad;

  // Lower score is better
  return roomsUsed * 1000 + timeslotsUsed * 100 + loadBalance * 10;
}

// Main scheduling function
async function generateSchedule(semester) {
  // Fetch all activities for the semester
  const activities = await Activity.find({ "course.semester": semester })
    .populate("course instructor")
    .lean();

  // Check if activities exist
  if (activities.length === 0) {
    throw new Error("No activities found for the specified semester");
  }

  // Replicate activities based on frequencyPerWeek
  const expandedActivities = [];
  activities.forEach((activity) => {
    for (let i = 0; i < activity.frequencyPerWeek; i++) {
      expandedActivities.push({
        ...activity,
        _id: `${activity._id}_${i}`, // Unique ID for each instance
        originalId: activity._id, // Reference to original activity
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

  // Try to find a valid schedule
  const found = await backtrack(
    sortedActivities,
    rooms,
    timeslots,
    schedule,
    instructorLoad,
    usedTimeslots,
    0
  );

  if (found) {
    // Save schedule to database
    await Schedule.deleteMany({ "activity.course.semester": semester });
    const savedEntries = await Schedule.insertMany(schedule);
    bestSchedule = savedEntries;
    bestScore = evaluateSchedule(schedule, rooms, timeslots, instructorLoad);

    // Try to optimize by exploring alternative schedules (limited iterations)
    const maxIterations = 5;
    for (let i = 0; i < maxIterations; i++) {
      const tempSchedule = [];
      const tempInstructorLoad = new Map();
      const tempUsedTimeslots = new Map();
      // Randomize room and timeslot order for variety
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
          0
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
          // Update database
          await Schedule.deleteMany({ "activity.course.semester": semester });
          bestSchedule = await Schedule.insertMany(tempSchedule);
        }
      }
    }
  } else {
    throw new Error("Unable to generate a valid schedule for the activities");
  }

  return bestSchedule;
}

module.exports = { generateSchedule };
