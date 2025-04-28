const mongoose = require("mongoose");

const ActivitySchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor" },
  studentGroup: { type: mongoose.Schema.Types.ObjectId, ref: "StudentGroup" },
  semester: { type: String, required: true },
  roomRequirement: { type: String, enum: ["LECTURE", "LAB", "SEMINAR"] },
  duration: Number,
  frequencyPerWeek: {
    type: Number,
    default: 1,
    min: 1,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

module.exports = mongoose.model("Activity", ActivitySchema);
