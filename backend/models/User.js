const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: {
    type: String,
    enum: ["admin", "apo", "user"],
    default: "user",
  },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isDeleted: { type: Boolean, default: false, index: true },
});

module.exports = mongoose.model("User", UserSchema);
