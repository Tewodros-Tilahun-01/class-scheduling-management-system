const mongoose = require("mongoose");

const lectureSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  maxLoad: { type: Number, required: true, min: 1 },
  isDeleted: { type: Boolean, default: false, index: true },
});

module.exports = mongoose.model("lecture", lectureSchema);
