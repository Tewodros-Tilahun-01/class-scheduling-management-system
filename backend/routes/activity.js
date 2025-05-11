const express = require("express");
const router = express.Router();
const Activity = require("../models/Activity");
const mongoose = require("mongoose");

// GET /api/activities - Retrieve activities filtered by semester (optional)
router.get("/", async (req, res) => {
  try {
    const { semester } = req.query;

    let query = { isDeleted: false };
    if (semester) {
      query.semester = semester;
    }
    const activities = await Activity.find(query).lean();
    res.json(activities);
  } catch (err) {
    console.error("Error fetching activities:", err);
    res
      .status(500)
      .json({ error: err.message || "Failed to fetch activities" });
  }
});

// POST /api/activities - Create a new activity
router.post("/", async (req, res) => {
  try {
    const {
      course,
      lecture,
      studentGroup,
      semester,
      roomRequirement,
      totalDuration,
      split,
    } = req.body;

    if (
      !course ||
      !lecture ||
      !studentGroup ||
      !semester ||
      !roomRequirement ||
      !totalDuration ||
      !split
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const activity = new Activity({
      course,
      lecture,
      studentGroup,
      semester,
      roomRequirement,
      totalDuration,
      split,
      createdBy: req.user._id,
    });

    await activity.save();
    res.status(201).json(activity);
  } catch (err) {
    console.error("Error creating activity:", err);
    res.status(500).json({ error: err.message || "Failed to create activity" });
  }
});

// PUT /api/activities/:id - Update an existing activity
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      course,
      lecture,
      studentGroup,
      semester,
      roomRequirement,
      totalDuration,
      split,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid activity ID" });
    }

    if (
      !course ||
      !lecture ||
      !studentGroup ||
      !semester ||
      !roomRequirement ||
      !totalDuration ||
      !split
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const activity = await Activity.findOneAndUpdate(
      { _id: id, isDeleted: false },
      {
        course,
        lecture,
        studentGroup,
        semester,
        roomRequirement,
        totalDuration,
        split,
      },
      { new: true, runValidators: true }
    );

    if (!activity) {
      return res.status(404).json({ error: "Activity not found or deleted" });
    }

    res.json(activity);
  } catch (err) {
    console.error("Error updating activity:", err);
    res.status(500).json({ error: err.message || "Failed to update activity" });
  }
});

// DELETE /api/activities/:id - Soft delete an activity
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid activity ID" });
    }

    const activity = await Activity.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!activity) {
      return res
        .status(404)
        .json({ error: "Activity not found or already deleted" });
    }

    res.json({ message: "Activity soft deleted successfully" });
  } catch (err) {
    console.error("Error deleting activity:", err);
    res.status(500).json({ error: err.message || "Failed to delete activity" });
  }
});

module.exports = router;
