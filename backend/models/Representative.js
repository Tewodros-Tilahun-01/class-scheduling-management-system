const { default: mongoose } = require("mongoose");

const RepresentativeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  department: {
    type: String,
    required: true,
    trim: true,
  },
  year: {
    type: Number,
    required: true,
    min: 1,
    max: 4,
  },
  isDeleted: { type: Boolean, default: false, index: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Representative", RepresentativeSchema);
