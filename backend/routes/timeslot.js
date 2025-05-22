const express = require("express");
const router = express.Router();
const Timeslot = require("../models/Timeslot");

// Get all timeslots
router.get("/", async (req, res) => {
  try {
    const timeslots = await Timeslot.find().lean();
    res.json(timeslots);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch timeslots" });
  }
});

// Add a new timeslot
router.post("/", async (req, res) => {
  try {
    const { day, startTime, endTime, preferenceScore } = req.body;
    const timeslot = new Timeslot({
      day,
      startTime,
      endTime,
      preferenceScore: preferenceScore || 10,
      
    });
    await timeslot.save();
    res.status(201).json(timeslot);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a timeslot
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { day, startTime, endTime, preferenceScore } = req.body;
    const timeslot = await Timeslot.findOneAndUpdate(
      { _id: id},
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
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const timeslot = await Timeslot.findOneAndDelete({
      _id: id,
      
    });
   
    if (!timeslot) {
      return res.status(404).json({ error: "Timeslot not found" });
    }
    res.json({ message: "Timeslot deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete timeslot" });
  }
});

// Get unique days from timeslots
router.get("/days/unique", async (req, res) => {
  try {
    const days = await Timeslot.distinct("day");
    res.json(days);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch unique days" });
  }
});

module.exports = router;
