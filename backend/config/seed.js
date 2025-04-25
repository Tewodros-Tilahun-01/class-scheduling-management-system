// config/seed.js
const Room = require("../models/Room");
const Course = require("../models/Course");
const Instructor = require("../models/Instructor");
const Activity = require("../models/Activity");
const Timeslot = require("../models/Timeslot");

const seedDatabase = async () => {
  await Promise.all([
    Room.deleteMany({}),
    Course.deleteMany({}),
    Instructor.deleteMany({}),
    Activity.deleteMany({}),
    Timeslot.deleteMany({}),
  ]);

  const rooms = await Room.insertMany([
    { name: "Room A", capacity: 50, department: "CS", type: "lecture" },
    { name: "Room B", capacity: 30, department: "CS", type: "lab" },
  ]);

  const courses = await Course.insertMany([
    { name: "Intro to Programming", code: "CS101", creditHours: 3 },
    { name: "Data Structures", code: "CS201", creditHours: 4 },
  ]);

  const instructors = await Instructor.insertMany([
    { name: "Dr. Alice", maxLoad: 6 },
    { name: "Prof. Bob", maxLoad: 9 },
  ]);

  const activities = await Activity.insertMany([
    {
      course: courses[0]._id,
      instructor: instructors[0]._id,
      duration: 2,
      roomRequirement: "lecture",
    },
    {
      course: courses[1]._id,
      instructor: instructors[1]._id,
      duration: 3,
      roomRequirement: "lab",
    },
  ]);

  const timeslots = await Timeslot.insertMany([
    {
      day: "Monday",
      startTime: "09:00",
      endTime: "11:00",
      preferenceScore: 10,
    },
    {
      day: "Tuesday",
      startTime: "13:00",
      endTime: "15:00",
      preferenceScore: 8,
    },
    {
      day: "Wednesday",
      startTime: "10:00",
      endTime: "12:00",
      preferenceScore: 7,
    },
  ]);

  console.log("✅ Seeded demo data!");
};

module.exports = seedDatabase;
