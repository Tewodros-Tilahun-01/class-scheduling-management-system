const express = require("express");
const router = express.Router();
const Instructor = require("../models/Instructor");

// GET /instructors - Retrieve all active instructors
router.get("/", async (req, res) => {
  try {
    const instructors = await Instructor.find({ isDeleted: false }).lean();
    res.json(instructors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /instructors - Create a new instructor
router.post("/", async (req, res) => {
  try {
    const { name, department, maxLoad } = req.body;
    if (!name || !department || !maxLoad) {
      return res
        .status(400)
        .json({ error: "Name, department, and maxLoad are required" });
    }
    if (typeof maxLoad !== "number" || maxLoad < 1) {
      return res
        .status(400)
        .json({ error: "Max load must be a positive number" });
    }
    const existingInstructor = await Instructor.findOne({
      name,
      isDeleted: false,
    });
    if (existingInstructor) {
      return res.status(400).json({ error: "Instructor name already exists" });
    }
    const instructor = new Instructor({ name, department, maxLoad });
    await instructor.save();
    res.status(201).json(instructor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /instructors/:id - Update an instructor
router.put("/:id", async (req, res) => {
  try {
    const { name, department, maxLoad } = req.body;
    if (!name || !department || !maxLoad) {
      return res
        .status(400)
        .json({ error: "Name, department, and maxLoad are required" });
    }
    if (typeof maxLoad !== "number" || maxLoad < 1) {
      return res
        .status(400)
        .json({ error: "Max load must be a positive number" });
    }
    const existingInstructor = await Instructor.findOne({
      name,
      _id: { $ne: req.params.id },
      isDeleted: false,
    });
    if (existingInstructor) {
      return res.status(400).json({ error: "Instructor name already exists" });
    }
    const instructor = await Instructor.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { name, department, maxLoad },
      { new: true, runValidators: true }
    );
    if (!instructor) {
      return res.status(404).json({ error: "Instructor not found or deleted" });
    }
    res.json(instructor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /instructors/:id - Soft delete an instructor
router.delete("/:id", async (req, res) => {
  try {
    const instructor = await Instructor.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!instructor) {
      return res
        .status(404)
        .json({ error: "Instructor not found or already deleted" });
    }
    res.json({ message: "Instructor soft deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
