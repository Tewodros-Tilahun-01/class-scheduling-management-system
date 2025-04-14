const mongoose = require("mongoose");

const ActivitySchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor" },
  duration: Number,
  studentGroup: String,
  roomRequirement: {
    type: String,
    required: false,
  },
});

module.exports = mongoose.model("Activity", ActivitySchema);
