const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
  name: String,
  capacity: Number,
  department: String,
  type: {
    type: String,
    enum: ["lecture", "lab", "seminar", "other"],
    default: "lecture",
  },
});

module.exports = mongoose.model("Room", RoomSchema);
