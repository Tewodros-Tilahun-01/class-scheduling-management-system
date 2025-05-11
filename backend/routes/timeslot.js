const express = require("express");
const router = express.Router();
const Timeslot = require("../models/Timeslot");
const { generateSchedule } = require("../services/scheduler");

// Middleware to verify user authentication (simplified)
const authMiddleware = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  next();
};

// Get all timeslots
router.get("/", authMiddleware, async (req, res) => {
  try {
    const timeslots = await Timeslot.find({ createdBy: req.user._id }).lean();
    res.json(timeslots);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch timeslots" });
  }
});

// Add a new timeslot
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { day, startTime, endTime, preferenceScore } = req.body;
    const timeslot = new Timeslot({
      day,
      startTime,
      endTime,
      preferenceScore: preferenceScore || 10,
      createdBy: req.user._id,
    });
    await timeslot.save();
    res.status(201).json(timeslot);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a timeslot
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { day, startTime, endTime, preferenceScore } = req.body;
    const timeslot = await Timeslot.findOneAndUpdate(
      { _id: id, createdBy: req.user._id },
      { day, startTime, endTime, preferenceScore },
      { new: true, runValidators: true }
    );
    if (!timeslot) {
      return res.status(404).json({ error: "Timeslot not found" });
    }
    res.json(timeslot);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a timeslot
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const timeslot = await Timeslot.findOneAndDelete({
      _id: id,
      createdBy: req.user._id,
    });
    if (!timeslot) {
      return res.status(404).json({ error: "Timeslot not found" });
    }
    res.json({ message: "Timeslot deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete timeslot" });
  }
});

// Generate schedule
router.post("/schedule", authMiddleware, async (req, res) => {
  try {
    const { semester, sessionLength } = req.body;
    const schedules = await generateSchedule(
      semester,
      req.user._id,
      sessionLength
    );
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
