const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema({
  courseCode: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  longName: { type: String, required: true },
  isDeleted: { type: Boolean, default: false, index: true },
});

module.exports = mongoose.model("Course", CourseSchema);
