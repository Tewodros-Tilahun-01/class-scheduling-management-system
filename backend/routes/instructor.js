const express = require("express");
const router = express.Router();
const Instructor = require("../models/Instructor");

// GET /instructors - Retrieve all instructors
router.get("/", async (req, res) => {
  try {
    const instructors = await Instructor.find().lean();
    res.json(instructors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
