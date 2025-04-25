const express = require("express");
const router = express.Router();
const { generateSchedule } = require("../services/scheduler");
const Schedule = require("../models/Schedule");

router.post("/generate", async (req, res) => {
  try {
    const { semester } = req.body;
    if (!semester) {
      return res.status(400).json({ error: "Semester is required" });
    }
    const schedule = await generateSchedule(semester);
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/all", async (req, res) => {
  try {
    const schedules = await Schedule.find()
      .populate({
        path: "activity",
        populate: ["course", "instructor"],
      })
      .populate("room")
      .populate("timeslot");

    res.json(schedules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;
