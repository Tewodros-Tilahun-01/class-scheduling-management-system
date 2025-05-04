const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Activity = require("../models/Activity");
const mongoose = require("mongoose");

// GET /api/activities - Retrieve all activities, optionally filtered by semester and ownership
router.get("/", async (req, res) => {
  try {
    const { semester, own } = req.query;
    const query = {};
    if (semester) {
      query.semester = semester;
    }
    if (own === "true") {
      query.createdBy = req.user._id;
    }
    const activities = await Activity.find(query)
      .populate("course", "courseCode name department longName")
      .populate("instructor", "name")
      .populate("studentGroup", "department year section expectedEnrollment")
      .populate("createdBy", "username name")
      .lean();
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/activities - Create a new activity
router.post("/", async (req, res) => {
  try {
    const {
      course,
      instructor,
      studentGroup,
      semester,
      roomRequirement,
      totalDuration,
      split,
    } = req.body;

    // Validate required fields
    if (
      !course ||
      !instructor ||
      !studentGroup ||
      !semester ||
      !roomRequirement ||
      !totalDuration ||
      !split
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Validate ObjectIds for course, instructor, and studentGroup
    if (
      !mongoose.Types.ObjectId.isValid(course) ||
      !mongoose.Types.ObjectId.isValid(instructor) ||
      !mongoose.Types.ObjectId.isValid(studentGroup)
    ) {
      return res
        .status(400)
        .json({ error: "Invalid course, instructor, or studentGroup ID" });
    }

    // Validate totalDuration and split as numbers
    if (isNaN(totalDuration) || totalDuration <= 0) {
      return res
        .status(400)
        .json({ error: "Total duration must be a positive number" });
    }
    if (isNaN(split) || split <= 0) {
      return res.status(400).json({ error: "Split must be a positive number" });
    }
    if (split > totalDuration) {
      return res
        .status(400)
        .json({ error: "Split cannot exceed total duration" });
    }

    // Validate roomRequirement against the enum
    const validRoomTypes = ["lecture", "lab", "seminar"];
    if (!validRoomTypes.includes(roomRequirement)) {
      return res.status(400).json({
        error: "Room requirement must be one of: lecture, lab, seminar",
      });
    }

    // Create the new activity
    const activity = new Activity({
      course,
      instructor,
      studentGroup,
      semester,
      roomRequirement,
      totalDuration: Number(totalDuration),
      split: Number(split),
      createdBy: req.user._id,
    });

    // Save the activity
    await activity.save();

    // Populate referenced fields for the response
    await activity.populate([
      {
        path: "course",
        select: "courseCode name department longName",
      },
      { path: "instructor", select: "name" },
      {
        path: "studentGroup",
        select: "department year section expectedEnrollment",
      },
      { path: "createdBy", select: "username name" },
    ]);

    res.status(201).json(activity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/activities/instructor/:instructorId - Retrieve schedules for an instructor
router.get("/instructor/:instructorId", async (req, res) => {
  try {
    const { instructorId } = req.params;
    const { semester, own } = req.query;
    if (!mongoose.Types.ObjectId.isValid(instructorId)) {
      return res.status(400).json({ error: "Invalid instructorId" });
    }

    const activityQuery = { instructor: instructorId };
    if (semester) {
      activityQuery.semester = semester;
    }
    if (own === "true") {
      activityQuery.createdBy = req.user._id;
    }
    const activities = await Activity.find(activityQuery)
      .populate("studentGroup", "department year section expectedEnrollment")
      .lean();

    const studentGroupIds = [
      ...new Set(activities.map((a) => a.studentGroup?._id?.toString())),
    ];

    const scheduleQuery = { studentGroup: { $in: studentGroupIds } };
    if (semester) {
      scheduleQuery["activity.semester"] = semester;
    }
    if (own === "true") {
      scheduleQuery.createdBy = req.user._id;
    }
    const schedules = await Schedule.find(scheduleQuery)
      .populate({
        path: "activity",
        populate: [
          { path: "course", select: "courseCode name" },
          { path: "instructor", select: "name" },
          {
            path: "studentGroup",
            select: "department year section expectedEnrollment",
          },
          { path: "createdBy", select: "username name" },
        ],
      })
      .populate("room", "name capacity type department")
      .populate("timeslot", "day startTime endTime preferenceScore")
      .populate("createdBy", "username name")
      .lean();

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
