const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  recipientRole: {
    type: String,
    enum: ["admin", "apo"],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null, // Use null for broadcast messages to recipientRole
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  actionUrl: {
    type: String,
    default: "",
  },
  actionLabel: {
    type: String,
    default: "",
  },
  severity: {
    type: String,
    enum: ["info", "error", "success", "warning"],
    default: "info",
  },
});

module.exports = mongoose.model("Notification", NotificationSchema);
