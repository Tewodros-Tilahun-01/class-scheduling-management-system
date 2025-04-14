const Activity = require("../models/Activity");
const Room = require("../models/Room");
const Timeslot = require("../models/Timeslot");
const Schedule = require("../models/Schedule");

async function generateSchedule(semester) {
  const activities = await Activity.find().populate("course instructor");
  const rooms = await Room.find();
  const timeslots = await Timeslot.find().sort({ preferenceScore: -1 });

  const schedule = [];
  const used = new Map();
  const instructorTimes = new Map();
  const instructorLoad = new Map();

  function isConflict(activity, timeslot, room) {
    const key = `${timeslot._id}-${room._id}`;
    const instructorKey = `${timeslot._id}-${activity.instructor._id}`;
    return used.has(key) || instructorTimes.has(instructorKey);
  }

  function mark(activity, timeslot, room) {
    const key = `${timeslot._id}-${room._id}`;
    const instructorKey = `${timeslot._id}-${activity.instructor._id}`;
    used.set(key, activity._id);
    instructorTimes.set(instructorKey, activity._id);

    const load = instructorLoad.get(activity.instructor._id) || 0;
    instructorLoad.set(activity.instructor._id, load + activity.duration);
  }

  for (const activity of activities) {
    const currentLoad = instructorLoad.get(activity.instructor._id) || 0;
    if (
      activity.instructor.maxLoad &&
      currentLoad + activity.duration > activity.instructor.maxLoad
    ) {
      continue;
    }

    let assigned = false;
    for (const timeslot of timeslots) {
      for (const room of rooms) {
        if (
          (activity.roomRequirement &&
            room.type !== activity.roomRequirement) ||
          isConflict(activity, timeslot, room)
        ) {
          continue;
        }

        const entry = new Schedule({
          activity: activity._id,
          timeslot: timeslot._id,
          room: room._id,
        });
        await entry.save();

        schedule.push(entry);
        mark(activity, timeslot, room);
        assigned = true;
        break;
      }
      if (assigned) break;
    }
  }

  return schedule;
}

module.exports = { generateSchedule };
