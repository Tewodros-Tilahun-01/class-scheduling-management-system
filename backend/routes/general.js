const express = require("express");
const router = express.Router();
const Lecture = require("../models/Lectures");
const StudentGroup = require("../models/StudentGroup");
const Course = require("../models/Course");
const Room = require("../models/Room");

// Get statistics for dashboard
router.get("/stats", async (req, res) => {
  try {
    // Get counts from all collections excluding deleted items
    const [lecturesCount, studentGroupsCount, coursesCount, roomsCount] =
      await Promise.all([
        Lecture.countDocuments({ isDeleted: false }),
        StudentGroup.countDocuments({ isDeleted: false }),
        Course.countDocuments({ isDeleted: false }),
        Room.countDocuments({ isDeleted: false }),
      ]);

    res.json({
      lectures: lecturesCount,
      studentGroups: studentGroupsCount,
      courses: coursesCount,
      rooms: roomsCount,
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

module.exports = router;
