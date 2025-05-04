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
});

module.exports = mongoose.model("Room", RoomSchema);
