const mongoose = require("mongoose");

const InstructorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  department: { type: String, required: true },
  maxLoad: { type: Number, required: true, min: 1 },
  isDeleted: { type: Boolean, default: false, index: true },
});

module.exports = mongoose.model("Instructor", InstructorSchema);
