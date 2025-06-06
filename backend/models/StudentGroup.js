const mongoose = require("mongoose");

const studentGroupSchema = new mongoose.Schema({
  department: { type: String, required: true },
  year: { type: Number, required: true },
  section: { type: String, required: true },
  isDeleted: { type: Boolean, default: false, index: true },
});

module.exports = mongoose.model("StudentGroup", studentGroupSchema);
