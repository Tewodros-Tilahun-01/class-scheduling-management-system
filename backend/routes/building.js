const express = require("express");
const Building = require("../models/Building");
const router = express.Router();

// Get all buildings
router.get("/", async (req, res) => {
  try {
    const buildings = await Building.find({ active: true }).sort({ name: 1 });
    res.json(buildings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a building by ID
router.get("/:id", async (req, res) => {
  try {
    const building = await Building.findById(req.params.id);
    if (!building) {
      return res.status(404).json({ message: "Building not found" });
    }
    res.json(building);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new building
router.post("/", async (req, res) => {
  try {
    const building = new Building(req.body);
    const newBuilding = await building.save();
    res.status(201).json(newBuilding);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a building
router.put("/:id", async (req, res) => {
  try {
    const building = await Building.findById(req.params.id);
    if (!building) {
      return res.status(404).json({ message: "Building not found" });
    }

    Object.assign(building, req.body);
    const updatedBuilding = await building.save();
    res.json(updatedBuilding);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a building (soft delete by setting active to false)
router.delete("/:id", async (req, res) => {
  try {
    const building = await Building.findById(req.params.id);
    if (!building) {
      return res.status(404).json({ message: "Building not found" });
    }

    building.active = false;
    await building.save();
    res.json({ message: "Building deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
