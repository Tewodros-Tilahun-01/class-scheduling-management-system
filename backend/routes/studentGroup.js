const express = require("express");
const router = express.Router();
const StudentGroup = require("../models/StudentGroup");

// GET /api/student-groups
router.get("/", async (req, res) => {
  try {
    const studentGroups = await StudentGroup.find({ isDeleted: false }).lean();
    res.json(studentGroups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/student-groups
router.post("/", async (req, res) => {
  try {
    const { department, year, section } = req.body;

    // Validate required fields
    if (!department || !year || !section) {
      return res
        .status(400)
        .json({ error: "Department, year, and section are required" });
    }

    // Check for existing student group (case-insensitive for department and section)
    const existingGroup = await StudentGroup.findOne({
      department: { $regex: `^${department}$`, $options: "i" },
      year,
      section: { $regex: `^${section}$`, $options: "i" },
      isDeleted: false,
    });

    if (existingGroup) {
      return res
        .status(400)
        .json({ error: "Student group with these details already exists" });
    }

    // Create and save new student group
    const studentGroup = new StudentGroup({ department, year, section });
    await studentGroup.save();
    res.status(201).json(studentGroup);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/student-groups/:id
router.put("/:id", async (req, res) => {
  try {
    const studentGroup = await StudentGroup.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    );
    if (!studentGroup) {
      return res
        .status(404)
        .json({ error: "Student group not found or deleted" });
    }
    res.json(studentGroup);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/student-groups/:id
router.delete("/:id", async (req, res) => {
  try {
    const studentGroup = await StudentGroup.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!studentGroup) {
      return res
        .status(404)
        .json({ error: "Student group not found or already deleted" });
    }
    res.json({ message: "Student group soft deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
