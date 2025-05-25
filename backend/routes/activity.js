const express = require("express");
const router = express.Router();
const Activity = require("../models/Activity");
const mongoose = require("mongoose");

// GET /api/activities - Retrieve activities filtered by semester (optional)
router.get("/", async (req, res) => {
  try {
    const { semester } = req.query;

    let query = { isDeleted: false };
    if (semester) {
      query.semester = semester;
    }
    const activities = await Activity.find(query).lean();
    res.json(activities);
  } catch (err) {
    console.error("Error fetching activities:", err);
    res
      .status(500)
      .json({ error: err.message || "Failed to fetch activities" });
  }
});

// POST /api/activities - Create a new activity
router.post("/", async (req, res) => {
  try {
    const {
      course,
      lecture,
      studentGroup,
      semester,
      roomRequirement,
      totalDuration,
      split,
    } = req.body;

    if (
      !course ||
      !lecture ||
      !studentGroup ||
      !semester ||
      !roomRequirement ||
      !totalDuration ||
      !split
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const activity = new Activity({
      course,
      lecture,
      studentGroup,
      semester,
      roomRequirement,
      totalDuration,
      split,
      createdBy: req.user.id,
    });

    await activity.save();
    res.status(201).json(activity);
  } catch (err) {
    console.error("Error creating activity:", err);
    res.status(500).json({ error: err.message || "Failed to create activity" });
  }
});

// PUT /api/activities/:id - Update an existing activity
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      course,
      lecture,
      studentGroup,
      semester,
      roomRequirement,
      totalDuration,
      split,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid activity ID" });
    }

    if (
      !course ||
      !lecture ||
      !studentGroup ||
      !semester ||
      !roomRequirement ||
      !totalDuration ||
      !split
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const activity = await Activity.findOneAndUpdate(
      { _id: id, isDeleted: false },
      {
        course,
        lecture,
        studentGroup,
        semester,
        roomRequirement,
        totalDuration,
        split,
      },
      { new: true, runValidators: true }
    );

    if (!activity) {
      return res.status(404).json({ error: "Activity not found or deleted" });
    }

    res.json(activity);
  } catch (err) {
    console.error("Error updating activity:", err);
    res.status(500).json({ error: err.message || "Failed to update activity" });
  }
});

// DELETE /api/activities/:id - Soft delete an activity
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid activity ID" });
    }

    const activity = await Activity.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!activity) {
      return res
        .status(404)
        .json({ error: "Activity not found or already deleted" });
    }

    res.json({ message: "Activity soft deleted successfully" });
  } catch (err) {
    console.error("Error deleting activity:", err);
    res.status(500).json({ error: err.message || "Failed to delete activity" });
  }
});

// GET /api/activities/:semester/stats - Get statistics for activities in a semester
router.get("/:semester/stats", async (req, res) => {
  try {
    const { semester } = req.params;
    const decodedSemester = decodeURIComponent(semester);

    // Get all activities for the semester
    const activities = await Activity.find({
      semester: decodedSemester,
      isDeleted: false,
    })
      .populate("course")
      .populate("lecture")
      .populate("studentGroup")
      .lean();

    // Calculate statistics
    const stats = {
      totalActivities: activities.length,
      totalHours: activities.reduce(
        (sum, activity) => sum + activity.totalDuration,
        0
      ),
      byRoomRequirement: {},
      byCourse: {},
      byLecture: {},
      byStudentGroup: {},
      byDepartment: {},
    };

    // Process each activity
    activities.forEach((activity) => {
      // Room requirement stats
      const roomReq = activity.roomRequirement;
      if (!stats.byRoomRequirement[roomReq]) {
        stats.byRoomRequirement[roomReq] = {
          count: 0,
          totalHours: 0,
        };
      }
      stats.byRoomRequirement[roomReq].count++;
      stats.byRoomRequirement[roomReq].totalHours += activity.totalDuration;

      // Course stats
      if (activity.course) {
        const courseId = activity.course._id.toString();
        if (!stats.byCourse[courseId]) {
          stats.byCourse[courseId] = {
            code: activity.course.courseCode,
            name: activity.course.name,
            count: 0,
            totalHours: 0,
            studentGroups: new Set(),
            lectures: new Set(),
          };
        }
        stats.byCourse[courseId].count++;
        stats.byCourse[courseId].totalHours += activity.totalDuration;
        stats.byCourse[courseId].studentGroups.add(activity.studentGroup?._id);
        stats.byCourse[courseId].lectures.add(activity.lecture?._id);
      }

      // Lecture stats
      if (activity.lecture) {
        const lectureId = activity.lecture._id.toString();
        if (!stats.byLecture[lectureId]) {
          stats.byLecture[lectureId] = {
            name: activity.lecture.name,
            count: 0,
            totalHours: 0,
            studentGroups: new Set(),
            courses: new Set(),
          };
        }
        stats.byLecture[lectureId].count++;
        stats.byLecture[lectureId].totalHours += activity.totalDuration;
        stats.byLecture[lectureId].studentGroups.add(
          activity.studentGroup?._id
        );
        stats.byLecture[lectureId].courses.add(activity.course?._id);
      }

      // Student group stats
      if (activity.studentGroup) {
        const groupId = activity.studentGroup._id.toString();
        if (!stats.byStudentGroup[groupId]) {
          stats.byStudentGroup[groupId] = {
            department: activity.studentGroup.department,
            year: activity.studentGroup.year,
            section: activity.studentGroup.section,
            count: 0,
            totalHours: 0,
            courses: new Set(),
            lectures: new Set(),
          };
        }
        stats.byStudentGroup[groupId].count++;
        stats.byStudentGroup[groupId].totalHours += activity.totalDuration;
        stats.byStudentGroup[groupId].courses.add(activity.course?._id);
        stats.byStudentGroup[groupId].lectures.add(activity.lecture?._id);

        // Department stats
        const dept = activity.studentGroup.department;
        if (!stats.byDepartment[dept]) {
          stats.byDepartment[dept] = {
            count: 0,
            totalHours: 0,
            studentGroups: new Set(),
            courses: new Set(),
            lectures: new Set(),
          };
        }
        stats.byDepartment[dept].count++;
        stats.byDepartment[dept].totalHours += activity.totalDuration;
        stats.byDepartment[dept].studentGroups.add(groupId);
        stats.byDepartment[dept].courses.add(activity.course?._id);
        stats.byDepartment[dept].lectures.add(activity.lecture?._id);
      }
    });

    // Convert Sets to counts and format the response
    const formatStats = (statsObj) => {
      return Object.entries(statsObj).map(([id, data]) => ({
        id,
        ...data,
        studentGroups: data.studentGroups?.size || 0,
        courses: data.courses?.size || 0,
        lectures: data.lectures?.size || 0,
      }));
    };

    const response = {
      overview: {
        totalActivities: stats.totalActivities,
        totalHours: stats.totalHours,
        roomRequirements: stats.byRoomRequirement,
      },
      courses: formatStats(stats.byCourse),
      lectures: formatStats(stats.byLecture),
      studentGroups: formatStats(stats.byStudentGroup),
      departments: formatStats(stats.byDepartment),
    };

    res.json(response);
  } catch (err) {
    console.error("Error fetching activity statistics:", err);
    res
      .status(500)
      .json({ error: err.message || "Failed to fetch activity statistics" });
  }
});

module.exports = router;
