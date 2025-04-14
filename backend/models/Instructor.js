const mongoose = require("mongoose");

const InstructorSchema = new mongoose.Schema({
  name: String,
  department: String,
  maxLoad: Number, // Max load the instructor can teach
});

module.exports = mongoose.model("Instructor", InstructorSchema);
