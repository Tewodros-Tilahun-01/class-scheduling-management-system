const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ScheduleSchema = new mongoose.Schema({
  activity: { type: Schema.Types.ObjectId, ref: "Activity", required: true },
  timeslot: { type: Schema.Types.ObjectId, ref: "Timeslot", required: true }, // First timeslot
  reservedTimeslots: [{ type: Schema.Types.ObjectId, ref: "Timeslot" }], // First and last timeslots (or single)
  totalDuration: {
    type: Number,
    required: true,
    min: [1, "Total duration must be at least 1 minute"],
  }, // Duration in minutes
  room: { type: Schema.Types.ObjectId, ref: "Room", required: true },
  studentGroup: {
    type: Schema.Types.ObjectId,
    ref: "StudentGroup",
  },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  semester: { type: String, required: true },
  isDeleted: { type: Boolean, default: false, index: true },
});

module.exports = mongoose.model("Schedule", ScheduleSchema);
