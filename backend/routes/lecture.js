const express = require("express");
const router = express.Router();
const Lecture = require("../models/Lectures");

// GET /lectures - Retrieve all active lectures
router.get("/", async (req, res) => {
  try {
    const lectures = await Lecture.find({ isDeleted: false }).lean();
    res.json(lectures);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /lectures - Create a new lecture
router.post("/", async (req, res) => {
  try {
    const { name, maxLoad } = req.body;
    if (!name || !maxLoad) {
      return res.status(400).json({ error: "Name and maxLoad are required" });
    }
    if (typeof maxLoad !== "number" || maxLoad < 1) {
      return res
        .status(400)
        .json({ error: "Max load must be a positive number" });
    }
    const existingLecture = await Lecture.findOne({
      name,
      isDeleted: false,
    });
    if (existingLecture) {
      return res.status(400).json({ error: "Lecture name already exists" });
    }
    const lecture = new Lecture({ name, maxLoad });
    await lecture.save();
    res.status(201).json(lecture);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /lectures/:id - Update a lecture
router.put("/:id", async (req, res) => {
  try {
    const { name, maxLoad } = req.body;
    if (!name || !maxLoad) {
      return res.status(400).json({ error: "Name and maxLoad are required" });
    }
    if (typeof maxLoad !== "number" || maxLoad < 1) {
      return res
        .status(400)
        .json({ error: "Max load must be a positive number" });
    }
    const existingLecture = await Lecture.findOne({
      name,
      _id: { $ne: req.params.id },
      isDeleted: false,
    });
    if (existingLecture) {
      return res.status(400).json({ error: "Lecture name already exists" });
    }
    const lecture = await Lecture.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { name, maxLoad },
      { new: true, runValidators: true }
    );
    if (!lecture) {
      return res.status(404).json({ error: "Lecture not found or deleted" });
    }
    res.json(lecture);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /lectures/:id - Soft delete a lecture
router.delete("/:id", async (req, res) => {
  try {
    const lecture = await Lecture.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!lecture) {
      return res
        .status(404)
        .json({ error: "Lecture not found or already deleted" });
    }
    res.json({ message: "Lecture soft deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
