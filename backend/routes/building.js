const express = require("express");
const Building = require("../models/Building");
const Room = require("../models/Room");
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
    // Check if building with same name exists (case-insensitive)
    const existingBuilding = await Building.findOne({
      name: { $regex: `^${req.body.name}$`, $options: "i" },
      active: true,
    });

    if (existingBuilding) {
      return res
        .status(400)
        .json({ message: "Building with this name already exists" });
    }

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

    // Check if another building with the same name exists (case-insensitive)
    if (req.body.name !== building.name) {
      const existingBuilding = await Building.findOne({
        name: { $regex: `^${req.body.name}$`, $options: "i" },
        active: true,
        _id: { $ne: req.params.id },
      });

      if (existingBuilding) {
        return res
          .status(400)
          .json({ message: "Building with this name already exists" });
      }

      // Update all rooms that have the old building name (case-insensitive)
      await Room.updateMany(
        { building: { $regex: `^${building.name}$`, $options: "i" } },
        { $set: { building: req.body.name } }
      );
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

    try {
      // Soft delete the building
      building.active = false;
      await building.save();

      // Soft delete all rooms associated with this building (case-insensitive)
      await Room.updateMany(
        {
          building: { $regex: `^${building.name}$`, $options: "i" },
        },
        { $set: { isDeleted: true } }
      );

      res.json({
        message: "Building and associated rooms deleted successfully",
      });
    } catch (error) {
      // If something fails, try to revert the building deletion
      if (building.active === false) {
        building.active = true;
        await building.save();
      }
      throw error;
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
