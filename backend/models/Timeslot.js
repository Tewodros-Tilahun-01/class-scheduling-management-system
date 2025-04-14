const mongoose = require("mongoose");

const TimeslotSchema = new mongoose.Schema({
  day: String,
  startTime: String,
  endTime: String,
  preferenceScore: { type: Number, default: 1 }, // Higher is better
});

module.exports = mongoose.model("Timeslot", TimeslotSchema);
