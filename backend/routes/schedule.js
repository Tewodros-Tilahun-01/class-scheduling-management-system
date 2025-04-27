const express = require("express");
const router = express.Router();
const { generateSchedule } = require("../services/scheduler");
const Schedule = require("../models/Schedule");
const Activity = require("../models/Activity");
const mongoose = require("mongoose");

// POST /generate - Generate a single schedule for the semester
router.post("/generate", async (req, res) => {
  try {
    const { semester } = req.body;
    // Validate that semester is provided
    if (!semester) {
      return res.status(400).json({ error: "Semester is required" });
    }
    const schedules = await generateSchedule(semester);
    res.json(schedules); // Returns { studentGroupId: { studentGroup, entries } }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /all - Retrieve all schedules, optionally grouped by student group
router.get("/all", async (req, res) => {
  try {
    const { groupByStudentGroup } = req.query; // e.g., ?groupByStudentGroup=true
    const schedules = await Schedule.find()
      .populate({
        path: "activity",
        populate: [
          { path: "course" },
          { path: "instructor" },
          { path: "studentGroup" },
        ],
      })
      .populate("room")
      .populate("timeslot")
      .lean();

    if (groupByStudentGroup === "true") {
      // Group schedules by studentGroup
      const groupedSchedules = schedules.reduce((acc, entry) => {
        const groupId = entry.studentGroup?._id?.toString() || "unknown";
        if (!acc[groupId]) {
          acc[groupId] = {
            studentGroup: entry.studentGroup,
            entries: [],
          };
        }
        acc[groupId].entries.push(entry);
        return acc;
      }, {});
      res.json(groupedSchedules);
    } else {
      res.json(schedules);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /group/:studentGroupId - Retrieve schedule for a specific student group
router.get("/group/:studentGroupId", async (req, res) => {
  try {
    const { studentGroupId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(studentGroupId)) {
      return res.status(400).json({ error: "Invalid studentGroupId" });
    }

    const schedules = await Schedule.find({ studentGroup: studentGroupId })
      .populate({
        path: "activity",
        populate: [
          { path: "course" },
          { path: "instructor" },
          { path: "studentGroup" },
        ],
      })
      .populate("room")
      .populate("timeslot")
      .lean();

    if (schedules.length === 0) {
      return res
        .status(404)
        .json({ error: "No schedule found for this student group" });
    }

    const studentGroup = schedules[0].studentGroup;
    res.json({
      studentGroup,
      entries: schedules,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /instructor/:instructorId - Retrieve schedules for an instructor
router.get("/instructor/:instructorId", async (req, res) => {
  try {
    const { instructorId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(instructorId)) {
      return res.status(400).json({ error: "Invalid instructorId" });
    }

    // Find activities for the instructor
    const activities = await Activity.find({ instructor: instructorId })
      .populate("studentGroup")
      .lean();

    // Get unique student group IDs
    const studentGroupIds = [
      ...new Set(activities.map((a) => a.studentGroup?._id?.toString())),
    ];

    // Fetch schedules for these student groups
    const schedules = await Schedule.find({
      studentGroup: { $in: studentGroupIds },
    })
      .populate({
        path: "activity",
        populate: [
          { path: "course" },
          { path: "instructor" },
          { path: "studentGroup" },
        ],
      })
      .populate("room")
      .populate("timeslot")
      .lean();

    // Group schedules by studentGroup
    const groupedSchedules = schedules.reduce((acc, entry) => {
      const groupId = entry.studentGroup?._id?.toString() || "unknown";
      if (!acc[groupId]) {
        acc[groupId] = {
          studentGroup: entry.studentGroup,
          entries: [],
        };
      }
      acc[groupId].entries.push(entry);
      return acc;
    }, {});

    res.json(groupedSchedules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
