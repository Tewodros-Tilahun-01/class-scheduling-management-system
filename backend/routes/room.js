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
    const roomTypes = await Room.distinct("type", {
      isDeleted: false,
      active: true,
    });
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
    const { name, capacity, type, building, active } = req.body;

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
      active: active !== undefined ? active : true, // Default to true if not provided
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
    const { name, capacity, type, building, active } = req.body;

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
      {
        name,
        capacity,
        type,
        building,
        active: active !== undefined ? active : true,
      },
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
    const schedule = await Schedule.findOne({ room: id });
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

//  for free rooms
router.get("/:semester/free-rooms", async (req, res) => {
  try {
    const { semester } = req.params;
    const { day, timeslot } = req.query;

    if (!day || !timeslot) {
      return res.status(400).json({
        error: "Both day and timeslot are required parameters",
      });
    }

    // Get all active rooms
    const rooms = await Room.find({
      isDeleted: false,
      active: true,
    }).lean();

    // First get the timeslot details
    const timeslotDetails = await mongoose
      .model("Timeslot")
      .findById(timeslot)
      .lean();

    if (!timeslotDetails) {
      return res.status(404).json({
        error: "Timeslot not found",
      });
    }

    // Get occupied rooms for the given day and timeslot
    const occupiedRooms = await Schedule.find({
      semester: decodeURIComponent(semester),
      reservedTimeslots: timeslot,
    })
      .distinct("room")
      .lean();

    const occupiedRoomsIds = occupiedRooms.map((room) => {
      return room.toString();
    });

    // Filter out occupied rooms and format the response
    const freeRooms = rooms
      .filter((room) => {
        return !occupiedRoomsIds.includes(room._id.toString());
      })
      .map((room) => ({
        _id: room._id,
        name: room.name,
        capacity: room.capacity,
        type: room.type,
        building: room.building,
      }));

    // Sort rooms by name for consistency
    freeRooms.sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      day,
      timeSlot: {
        startTime: timeslotDetails.startTime,
        endTime: timeslotDetails.endTime,
      },
      rooms: freeRooms,
    });
  } catch (err) {
    console.error("Error fetching free rooms:", err);
    res.status(500).json({
      error: err.message || "Failed to fetch free rooms",
    });
  }
});

module.exports = router;
