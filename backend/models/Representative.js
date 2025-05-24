const { Schema } = require("mongoose");
const { default: mongoose } = require("mongoose");

const RepresentativeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  studentGroup: {
    type: Schema.Types.ObjectId,
    ref: "StudentGroup",
  },
  isDeleted: { type: Boolean, default: false, index: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Representative", RepresentativeSchema);
