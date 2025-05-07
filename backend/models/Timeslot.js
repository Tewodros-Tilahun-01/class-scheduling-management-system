const mongoose = require("mongoose");

const TimeslotSchema = new mongoose.Schema({
  day: {
    type: String,

    required: true,
  },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  preferenceScore: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false, index: true },
});

module.exports = mongoose.model("Timeslot", TimeslotSchema);
