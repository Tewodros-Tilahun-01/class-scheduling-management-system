const express = require("express");
const router = express.Router();
const Course = require("../models/Course");
const mongoose = require("mongoose");

// GET /api/courses - Retrieve all courses
router.get("/", async (req, res) => {
  try {
    const courses = await Course.find().lean();
    res.json(courses);
  } catch (err) {
    console.error("Error fetching courses:", err);
    res.status(500).json({ error: err.message || "Failed to fetch courses" });
  }
});

// POST /api/courses - Create a new course
router.post("/", async (req, res) => {
  try {
    const { courseCode, name, longName } = req.body;

    // Validate required fields
    if (!courseCode || !name || !longName) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check for duplicate courseCode
    const existingCourse = await Course.findOne({ courseCode });
    if (existingCourse) {
      return res.status(400).json({ error: "Course code already exists" });
    }

    const course = new Course({
      courseCode,
      name,
      longName,
    });

    await course.save();
    res.status(201).json(course);
  } catch (err) {
    console.error("Error creating course:", err);
    res.status(500).json({ error: err.message || "Failed to create course" });
  }
});

// PUT /api/courses/:id - Update an existing course
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { courseCode, name, longName } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid course ID" });
    }

    // Validate required fields
    if (!courseCode || !name || !longName) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check for duplicate courseCode (excluding the current course)
    const existingCourse = await Course.findOne({
      courseCode,
      _id: { $ne: id },
    });
    if (existingCourse) {
      return res.status(400).json({ error: "Course code already exists" });
    }

    const course = await Course.findByIdAndUpdate(
      id,
      { courseCode, name, longName },
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json(course);
  } catch (err) {
    console.error("Error updating course:", err);
    res.status(500).json({ error: err.message || "Failed to update course" });
  }
});

// DELETE /api/courses/:id - Delete a course
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid course ID" });
    }

    const course = await Course.findByIdAndDelete(id);

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json({ message: "Course deleted successfully" });
  } catch (err) {
    console.error("Error deleting course:", err);
    res.status(500).json({ error: err.message || "Failed to delete course" });
  }
});

module.exports = router;
