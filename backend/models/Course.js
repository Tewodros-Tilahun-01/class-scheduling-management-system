const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema({
  courseCode: String,
  name: String,
  department: String,
  longName: String,
});

module.exports = mongoose.model("Course", CourseSchema);
