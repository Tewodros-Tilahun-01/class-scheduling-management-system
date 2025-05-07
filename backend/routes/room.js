const express = require("express");
const router = express.Router();
const Room = require("../models/Room");
const Schedule = require("../models/Schedule");
const mongoose = require("mongoose");

// GET /api/rooms - Retrieve all active rooms
router.get("/", async (req, res) => {
  try {
    const rooms = await Room.find({ isDeleted: false }).lean();
    res.json(rooms);
  } catch (err) {
    console.error("Error fetching rooms:", err);
    res.status(500).json({ error: err.message || "Failed to fetch rooms" });
  }
});

// GET /api/rooms/room-types - Retrieve distinct room types
router.get("/room-types", async (req, res) => {
  try {
    const roomTypes = await Room.distinct("type", { isDeleted: false });
    res.json(roomTypes);
  } catch (err) {
    console.error("Error fetching room types:", err);
    res
      .status(500)
      .json({ error: err.message || "Failed to fetch room types" });
  }
});

// POST /api/rooms - Create a new room
router.post("/", async (req, res) => {
  try {
    const { name, capacity, type, building } = req.body;

    // Validate required fields
    if (!name || !capacity || !type || !building) {
      return res
        .status(400)
        .json({ error: "Name, capacity, type, and building are required" });
    }

    // Check for duplicate room name
    const existingRoom = await Room.findOne({ name, isDeleted: false });
    if (existingRoom) {
      return res.status(400).json({ error: "Room name already exists" });
    }

    const room = new Room({
      name,
      capacity,
      type,
      building,
    });

    await room.save();
    res.status(201).json(room);
  } catch (err) {
    console.error("Error creating room:", err);
    res.status(500).json({ error: err.message || "Failed to create room" });
  }
});

// PUT /api/rooms/:id - Update an existing room
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, capacity, type, building } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid room ID" });
    }

    // Validate required fields
    if (!name || !capacity || !type || !building) {
      return res
        .status(400)
        .json({ error: "Name, capacity, type, and building are required" });
    }

    // Check for duplicate room name (excluding the current room)
    const existingRoom = await Room.findOne({
      name,
      _id: { $ne: id },
      isDeleted: false,
    });
    if (existingRoom) {
      return res.status(400).json({ error: "Room name already exists" });
    }

    const room = await Room.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { name, capacity, type, building },
      { new: true, runValidators: true }
    );

    if (!room) {
      return res.status(404).json({ error: "Room not found or deleted" });
    }

    res.json(room);
  } catch (err) {
    console.error("Error updating room:", err);
    res.status(500).json({ error: err.message || "Failed to update room" });
  }
});

// DELETE /api/rooms/:id - Soft delete a room
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid room ID" });
    }

    // Check if room is referenced by any schedules
    const schedule = await Schedule.findOne({ room: id, isDeleted: false });
    if (schedule) {
      return res.status(400).json({ error: "Room is linked to a schedule" });
    }

    const room = await Room.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!room) {
      return res
        .status(404)
        .json({ error: "Room not found or already deleted" });
    }

    res.json({ message: "Room soft deleted successfully" });
  } catch (err) {
    console.error("Error deleting room:", err);
    res.status(500).json({ error: err.message || "Failed to delete room" });
  }
});

module.exports = router;
