const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema({
  code: String,
  name: String,
  department: String,
  program: String,
  semester: Number,
  year: Number,
});

module.exports = mongoose.model("Course", CourseSchema);
