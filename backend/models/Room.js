const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
  },
  type: {
    type: String,
    enum: ["lecture", "lab", "seminar", "other"],
    default: "lecture",
    required: true,
  },
  building: {
    type: String,
    required: true,
    trim: true,
  },
  isDeleted: { type: Boolean, default: false, index: true },
  active: { type: Boolean, default: true, index: true }, // New active field
});

module.exports = mongoose.model("Room", RoomSchema);
