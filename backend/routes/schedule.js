const express = require("express");
const router = express.Router();
const { generateSchedule } = require("../services/scheduler");

router.post("/generate", async (req, res) => {
  try {
    const schedule = await generateSchedule(req.body.semester);
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
