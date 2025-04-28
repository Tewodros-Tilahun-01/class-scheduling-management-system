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
      .populate(
        "course",
        "courseCode name department longName expectedEnrollment"
      )
      .populate("instructor", "name")
      .populate("studentGroup")
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
      courseId,
      instructorId,
      studentGroup,
      semester,
      roomRequirement,
      duration,
      frequencyPerWeek,
    } = req.body;

    // Validate required fields
    if (
      !courseId ||
      !instructorId ||
      !studentGroup ||
      !semester ||
      !roomRequirement ||
      !duration ||
      !frequencyPerWeek
    ) {
      console.log(courseId, instructorId, studentGroup);
      return res.status(400).json({ error: "All fields are required" });
    }

    // Validate ObjectIds for courseId, instructorId, and studentGroup
    if (
      !mongoose.Types.ObjectId.isValid(courseId) ||
      !mongoose.Types.ObjectId.isValid(instructorId) ||
      !mongoose.Types.ObjectId.isValid(studentGroup)
    ) {
      return res
        .status(400)
        .json({ error: "Invalid course, instructor, or studentGroup ID" });
    }

    // Validate duration and frequencyPerWeek as numbers
    if (isNaN(duration) || duration <= 0) {
      return res
        .status(400)
        .json({ error: "Duration must be a positive number" });
    }
    if (isNaN(frequencyPerWeek) || frequencyPerWeek <= 0) {
      return res
        .status(400)
        .json({ error: "Frequency per week must be a positive number" });
    }

    // Validate roomRequirement against the enum
    const validRoomTypes = ["LECTURE", "LAB", "SEMINAR"];
    if (!validRoomTypes.includes(roomRequirement.toUpperCase())) {
      return res.status(400).json({
        error: "Room requirement must be one of: LECTURE, LAB, SEMINAR",
      });
    }

    // Create the new activity
    const activity = new Activity({
      course: courseId,
      instructor: instructorId,
      studentGroup,
      semester,
      roomRequirement: roomRequirement.toUpperCase(),
      duration: Number(duration),
      frequencyPerWeek: Number(frequencyPerWeek),
      createdBy: req.user._id,
    });

    // Save the activity
    await activity.save();

    // Populate referenced fields for the response
    await activity.populate(["course", "instructor"]);

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
      .populate("studentGroup")
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
