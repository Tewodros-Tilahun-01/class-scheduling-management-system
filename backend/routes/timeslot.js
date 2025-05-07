const express = require("express");
const router = express.Router();
const Timeslot = require("../models/Timeslot");
const mongoose = require("mongoose");

// GET /api/timeslots - Retrieve all active timeslots
router.get("/", async (req, res) => {
  try {
    const timeslots = await Timeslot.find({ isDeleted: false }).lean();
    res.json(timeslots);
  } catch (err) {
    console.error("Error fetching timeslots:", err);
    res.status(500).json({ error: err.message || "Failed to fetch timeslots" });
  }
});

// POST /api/timeslots - Create a new timeslot
router.post("/", async (req, res) => {
  try {
    const { day, startTime, endTime, preferenceScore } = req.body;

    if (!day || !startTime || !endTime) {
      return res
        .status(400)
        .json({ error: "Day, startTime, and endTime are required" });
    }

    const timeslot = new Timeslot({
      day,
      startTime,
      endTime,
      preferenceScore,
    });

    await timeslot.save();
    res.status(201).json(timeslot);
  } catch (err) {
    console.error("Error creating timeslot:", err);
    res.status(500).json({ error: err.message || "Failed to create timeslot" });
  }
});

// PUT /api/timeslots/:id - Update an existing timeslot
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { day, startTime, endTime, preferenceScore } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid timeslot ID" });
    }

    if (!day || !startTime || !endTime) {
      return res
        .status(400)
        .json({ error: "Day, startTime, and endTime are required" });
    }

    const timeslot = await Timeslot.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { day, startTime, endTime, preferenceScore },
      { new: true, runValidators: true }
    );

    if (!timeslot) {
      return res.status(404).json({ error: "Timeslot not found or deleted" });
    }

    res.json(timeslot);
  } catch (err) {
    console.error("Error updating timeslot:", err);
    res.status(500).json({ error: err.message || "Failed to update timeslot" });
  }
});

// DELETE /api/timeslots/:id - Soft delete a timeslot
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid timeslot ID" });
    }

    const timeslot = await Timeslot.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!timeslot) {
      return res
        .status(404)
        .json({ error: "Timeslot not found or already deleted" });
    }

    res.json({ message: "Timeslot soft deleted successfully" });
  } catch (err) {
    console.error("Error deleting timeslot:", err);
    res.status(500).json({ error: err.message || "Failed to delete timeslot" });
  }
});

module.exports = router;
