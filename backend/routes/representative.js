const express = require("express");
const Attendance = require("../models/Attendance");
const Representative = require("../models/Representative");
const Schedule = require("../models/Schedule");
const Lectures = require("../models/Lectures");
const Course = require("../models/Course");
const router = express.Router();

router.get("/attendance", async (req, res) => {
  const { representativeId } = req.query;
  try {
    const attendance = await Attendance.find({
      markedBy: representativeId,
    })
      .populate("teacher", "", Lectures)
      .populate("course", "", Course)
      .populate("markedBy", "", Representative);

    res.json(attendance);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});
router.post("/attendance", async (req, res) => {
  const {
    schedule,
    teacher,
    course,
    date,
    status,
    markedBy,
    notes,
    arrivalTime,
    departureTime,
  } = req.body;
  console.log(schedule);
  try {
    // Check if the date is today
    const today = new Date();
    const attendanceDate = new Date(date);
    // if (
    //   today.getFullYear() !== attendanceDate.getFullYear() ||
    //   today.getMonth() !== attendanceDate.getMonth() ||
    //   today.getDate() !== attendanceDate.getDate()
    // ) {
    //   return res
    //     .status(400)
    //     .json({ message: "Attendance can only be marked for today" });
    // }

    // Check if attendance already exists for this schedule and date
    const existingAttendance = await Attendance.findOne({
      schedule: schedule,
      date: {
        $gte: new Date(new Date(date).setHours(0, 0, 0)),
        $lt: new Date(new Date(date).setHours(23, 59, 59)),
      },
    });
    console.log(existingAttendance);

    if (existingAttendance) {
      return res.status(400).json({
        message: "Attendance has already been marked for this schedule today",
        existingAttendance,
      });
    }

    const representative = await Representative.findById(markedBy);
    console.log(representative, markedBy);
    if (!representative) {
      return res.status(404).json({ message: "Representative not found" });
    }
    // const existingSchedule = await Schedule.findById(schedule);
    // if (!existingSchedule) {
    //   return res.status(404).json({ message: "Schedule not found" });
    // }
    // const existingTeacher = await Lecture.findById(teacher);
    // if (!existingTeacher) {
    //   return res.status(404).json({ message: "Teacher not found" });
    // }
    // const existingCourse = await Course.findById(course);
    // if (!existingCourse) {
    //   return res.status(404).json({ message: "Course not found" });
    // }

    const attendance = await Attendance.create({
      schedule: schedule,
      teacher: teacher,
      course: course,
      date,
      status,
      markedBy: markedBy,
      notes,
      arrivalTime,
      departureTime,
    });
    console.log(attendance);

    const newAttendance = await attendance.save();
    console.log(newAttendance);
    res.status(201).json({ message: "Attendance marked successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
