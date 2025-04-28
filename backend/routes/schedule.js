const express = require("express");
const router = express.Router();
const { generateSchedule } = require("../services/scheduler");
const Schedule = require("../models/Schedule");
const mongoose = require("mongoose");

// POST /schedules/generate - Generate a single schedule for the semester
router.post("/generate", async (req, res) => {
  try {
    const { semester } = req.body;
    if (!semester) {
      return res.status(400).json({ error: "Semester is required" });
    }
    const schedules = await generateSchedule(semester, req.user._id);
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /schedules - Retrieve all schedules, optionally grouped or filtered by semester and ownership
router.get("/", async (req, res) => {
  try {
    const { groupByStudentGroup, semester, own } = req.query;
    const query = {};
    if (semester) {
      query["activity.semester"] = semester;
    }
    if (own === "true") {
      query.createdBy = req.user._id;
    }
    const schedules = await Schedule.find(query)
      .populate({
        path: "activity",
        populate: [
          { path: "course" },
          { path: "instructor" },
          { path: "studentGroup" },
          { path: "createdBy", select: "username name" },
        ],
      })
      .populate("room")
      .populate("timeslot")
      .populate({ path: "createdBy", select: "username name" })
      .lean();

    if (groupByStudentGroup === "true") {
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

// GET /schedules/:semester - Retrieve schedules for a specific semester
router.get("/:semester", async (req, res) => {
  try {
    const { semester } = req.params;
    const { own } = req.query;
    const query = { "activity.semester": semester };
    if (own === "true") {
      query.createdBy = req.user._id;
    }
    const schedules = await Schedule.find(query)
      .populate({
        path: "activity",
        populate: [
          { path: "course" },
          { path: "instructor" },
          { path: "studentGroup" },
          { path: "createdBy", select: "username name" },
        ],
      })
      .populate("room")
      .populate("timeslot")
      .populate({ path: "createdBy", select: "username name" })
      .lean();

    if (schedules.length === 0) {
      return res
        .status(404)
        .json({ error: "No schedules found for this semester" });
    }

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

// GET /schedules/group/:studentGroupId - Retrieve schedule for a specific student group
router.get("/group/:studentGroupId", async (req, res) => {
  try {
    const { studentGroupId } = req.params;
    const { semester, own } = req.query;
    if (!mongoose.Types.ObjectId.isValid(studentGroupId)) {
      return res.status(400).json({ error: "Invalid studentGroupId" });
    }

    const query = { studentGroup: studentGroupId };
    if (semester) {
      query["activity.semester"] = semester;
    }
    if (own === "true") {
      query.createdBy = req.user._id;
    }

    const schedules = await Schedule.find(query)
      .populate({
        path: "activity",
        populate: [
          { path: "course" },
          { path: "instructor" },
          { path: "studentGroup" },
          { path: "createdBy", select: "username name" },
        ],
      })
      .populate("room")
      .populate("timeslot")
      .populate({ path: "createdBy", select: "username name" })
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

module.exports = router;
