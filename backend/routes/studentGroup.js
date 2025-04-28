const express = require("express");
const router = express.Router();
const StudentGroup = require("../models/StudentGroup");

// GET /api/student-groups
router.get("/", async (req, res) => {
  try {
    const studentGroups = await StudentGroup.find().lean();
    res.json(studentGroups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/student-groups
router.post("/", async (req, res) => {
  try {
    const studentGroup = new StudentGroup(req.body);
    await studentGroup.save();
    res.status(201).json(studentGroup);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/student-groups/:id
router.put("/:id", async (req, res) => {
  try {
    const studentGroup = await StudentGroup.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!studentGroup) {
      return res.status(404).json({ error: "Student group not found" });
    }
    res.json(studentGroup);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/student-groups/:id
router.delete("/:id", async (req, res) => {
  try {
    const studentGroup = await StudentGroup.findByIdAndDelete(req.params.id);
    if (!studentGroup) {
      return res.status(404).json({ error: "Student group not found" });
    }
    res.json({ message: "Student group deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
