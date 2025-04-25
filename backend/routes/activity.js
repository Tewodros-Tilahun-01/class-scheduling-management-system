const express = require("express");
const router = express.Router();
const Activity = require("../models/Activity");
const mongoose = require("mongoose");

// Create a new activity
router.post("/", async (req, res) => {
  try {
    const {
      courseId,
      instructorId,
      duration,
      studentGroup,
      roomRequirement,
      frequencyPerWeek,
    } = req.body;

    // Validate required fields
    if (!courseId || !instructorId || !duration || !studentGroup) {
      return res
        .status(400)
        .json({
          error:
            "courseId, instructorId, duration, and studentGroup are required",
        });
    }

    // Validate ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(courseId) ||
      !mongoose.Types.ObjectId.isValid(instructorId)
    ) {
      return res
        .status(400)
        .json({ error: "Invalid courseId or instructorId" });
    }

    // Validate duration
    if (isNaN(duration) || duration <= 0) {
      return res
        .status(400)
        .json({ error: "Duration must be a positive number" });
    }

    // Validate roomRequirement if provided
    if (
      roomRequirement &&
      !["lecture", "lab", "seminar", "other"].includes(roomRequirement)
    ) {
      return res.status(400).json({ error: "Invalid roomRequirement" });
    }

    // Validate frequencyPerWeek
    if (frequencyPerWeek && (isNaN(frequencyPerWeek) || frequencyPerWeek < 1)) {
      return res
        .status(400)
        .json({ error: "frequencyPerWeek must be a positive integer" });
    }

    const activity = new Activity({
      course: courseId,
      instructor: instructorId,
      duration: Number(duration),
      studentGroup,
      roomRequirement: roomRequirement || null,
      frequencyPerWeek: frequencyPerWeek || 1,
    });

    await activity.save();
    res.status(201).json(activity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
