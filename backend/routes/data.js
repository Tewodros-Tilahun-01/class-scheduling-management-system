const express = require("express");
const router = express.Router();
const Course = require("../models/Course");
const Instructor = require("../models/Instructor");
const Room = require("../models/Room");

// Get all courses
router.get("/courses", async (req, res) => {
  try {
    const courses = await Course.find().select("code name _id");
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all instructors
router.get("/instructors", async (req, res) => {
  try {
    const instructors = await Instructor.find().select("name _id");
    res.json(instructors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get room types
router.get("/room-types", async (req, res) => {
  try {
    const roomTypes = await Room.distinct("type");
    res.json(roomTypes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
