const mongoose = require("mongoose");

const buildingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Building name is required"],
      unique: true,
      trim: true,
    },

    active: {
      type: Boolean,
      default: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Add index for better query performance
buildingSchema.index({ name: 1, code: 1 });

const Building = mongoose.model("Building", buildingSchema);

module.exports = Building;
