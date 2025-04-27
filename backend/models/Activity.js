const mongoose = require("mongoose");

const ActivitySchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor" },
  duration: Number,
  studentGroup: { type: mongoose.Schema.Types.ObjectId, ref: "StudentGroup" },
  roomRequirement: {
    type: String,
    required: false,
  },
  frequencyPerWeek: {
    type: Number,
    default: 1,
    min: 1,
  },
});

module.exports = mongoose.model("Activity", ActivitySchema);
