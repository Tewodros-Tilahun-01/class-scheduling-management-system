const express = require("express");
const Attendance = require("../models/Attendance");
const Representative = require("../models/Representative");
const Schedule = require("../models/Schedule");
const Lectures = require("../models/Lectures");
const Course = require("../models/Course");
const Notification = require("../models/Notification");
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

    if (existingAttendance) {
      return res.status(400).json({
        message: "Attendance has already been marked for this schedule today",
        existingAttendance,
      });
    }

    const representative = await Representative.findById(markedBy);
    if (!representative) {
      return res.status(404).json({ message: "Representative not found" });
    }
    const existingSchedule = await Schedule.findById(schedule);
    if (!existingSchedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }
    const existingTeacher = await Lectures.findById(teacher);
    if (!existingTeacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    const existingCourse = await Course.findById(course);
    if (!existingCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

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

    const newAttendance = await attendance.save();
    res.status(201).json({ message: "Attendance marked successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});
router.post("/askReschedule", async (req, res) => {
  const { reschedule } = req.body;

  try {
    const scheduleData = await Schedule.findById(reschedule._id);
    if (!scheduleData) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    const notification = await Notification.create({
      user: reschedule.createdBy._id, // Required field
      title: "Reschedule Request",
      message: `Reschedule requested for:\n
• Course: ${reschedule.course.name}
\n• Teacher: ${reschedule.teacher.name}
\n • Group: ${reschedule.classGroup.department}
\n• Room: ${reschedule.room}
`,
      type: "warning",
      isRead: false,
      metadata: {
        scheduleId: reschedule._id,
        requestedBy: reschedule.createdBy._id,
      },
      actionUrl: `/activity`,
      actionLabel: `view activity`,
      severity: "warning",
    });

    await notification.save();
    res.status(201).json({ message: "Reschedule request sent successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});
module.exports = router;
