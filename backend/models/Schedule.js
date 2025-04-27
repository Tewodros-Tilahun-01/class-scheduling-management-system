const mongoose = require("mongoose");

const ScheduleSchema = new mongoose.Schema({
  activity: { type: mongoose.Schema.Types.ObjectId, ref: "Activity" },
  timeslot: { type: mongoose.Schema.Types.ObjectId, ref: "Timeslot" },
  room: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
  studentGroup: { type: mongoose.Schema.Types.ObjectId, ref: "StudentGroup" },
});

module.exports = mongoose.model("Schedule", ScheduleSchema);
