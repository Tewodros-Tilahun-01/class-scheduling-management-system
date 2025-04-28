const express = require("express");
const router = express.Router();
const Timeslot = require("../models/Timeslot");

// GET /timeslots - Retrieve all timeslots
router.get("/", async (req, res) => {
  try {
    const timeslots = await Timeslot.find().lean();
    res.json(timeslots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
