const mongoose = require("mongoose");
const { Schema } = mongoose;

const representativeSessionSchema = new Schema({
  rep_id: {
    type: Schema.Types.ObjectId,
    ref: "Representative",
    required: true,
  },
  token: { type: String, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const RepresentativeSession = mongoose.model(
  "RepresentativeSession",
  representativeSessionSchema
);
module.exports = RepresentativeSession;
