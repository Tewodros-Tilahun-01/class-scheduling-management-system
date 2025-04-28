const express = require("express");
const router = express.Router();
const Room = require("../models/Room");

// Get room types
router.get("/room-types", async (req, res) => {
  try {
    const roomTypes = await Room.distinct("type");
    res.json(roomTypes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;
