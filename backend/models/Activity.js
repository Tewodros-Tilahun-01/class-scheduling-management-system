const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  lecture: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "lecture",
    required: true,
  },
  studentGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StudentGroup",
    required: true,
  },
  semester: {
    type: String,
    required: true,
  },
  roomRequirement: {
    type: String,
    enum: ["lecture", "lab", "seminar"],
    required: true,
  },
  totalDuration: {
    type: Number,
    required: true,
    min: 1,
  },
  split: {
    type: Number,
    required: true,
    min: 1,
    validate: {
      validator: function (value) {
        return this.totalDuration >= value;
      },
      message: "Split must not exceed totalDuration",
    },
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  isDeleted: { type: Boolean, default: false, index: true },
});

module.exports = mongoose.model("Activity", activitySchema);
