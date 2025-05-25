const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  schedule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Schedule",
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lecture",
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
  },
  date: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["present", "absent", "late", "substitute", "pending", "excused"],
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Representative",
  },
  notes: {
    type: String,
    default: "",
  },
  arrivalTime: {
    type: String,
  },
});

module.exports = mongoose.model("Attendance", attendanceSchema);
