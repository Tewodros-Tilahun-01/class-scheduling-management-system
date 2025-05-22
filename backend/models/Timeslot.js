const mongoose = require("mongoose");

const TimeslotSchema = new mongoose.Schema({
  day: { type: String, required: true, index: true }, // Add index here
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  preferenceScore: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false, index: true },
});

TimeslotSchema.pre("save", function (next) {
  const start = parseTime(this.startTime);
  const end = parseTime(this.endTime);
  this.duration = end - start;
  next();
});

function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + (minutes || 0);
}

module.exports = mongoose.model("Timeslot", TimeslotSchema);
