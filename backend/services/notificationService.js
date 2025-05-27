const User = require("../models/User");
const Notification = require("../models/Notification");

/**
 * Creates a new notification for a user
 * @param {string} userId - The ID of the user to notify
 * @param {string} title - The notification title
 * @param {string} message - The notification message
 * @param {string} type - The notification type (info, success, warning, error, message, system)
 * @param {Object} [metadata] - Additional metadata for the notification
 * @returns {Promise<Object>} The created notification
 */
async function createNotification(
  userId,
  title,
  message,
  type = "info",
  metadata = {}
) {
  try {
    const notification = new Notification({
      user: userId,
      title,
      message,
      type,
      metadata,
      isRead: false,
      timestamp: new Date(),
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

/**
 * Creates a schedule generation notification
 * @param {string} userId - The ID of the user who initiated the generation
 * @param {string} status - The status of the generation (success/failed)
 * @param {string} [errorMessage] - Error message if status is failed
 * @returns {Promise<Object>} The created notification
 */
async function createScheduleGenerationNotification(
  userId,
  status,
  errorMessage = null
) {
  const isSuccess = status === "success";
  const title = isSuccess
    ? "Schedule Generation Complete"
    : "Schedule Generation Failed";
  const message = isSuccess
    ? "Your schedule has been successfully generated. You can now view and manage it."
    : `Schedule generation failed: ${errorMessage || "Unknown error occurred"}`;
  const type = isSuccess ? "success" : "error";

  return createNotification(userId, title, message, type, {
    action: "view_schedule",
    status,
  });
}

/**
 * Creates a schedule regeneration notification
 * @param {string} userId - The ID of the user who initiated the regeneration
 * @param {string} status - The status of the regeneration (success/failed)
 * @param {string} [errorMessage] - Error message if status is failed
 * @returns {Promise<Object>} The created notification
 */
async function createScheduleRegenerationNotification(
  userId,
  status,
  errorMessage = null
) {
  const isSuccess = status === "success";
  const title = isSuccess
    ? "Schedule Regeneration Complete"
    : "Schedule Regeneration Failed";
  const message = isSuccess
    ? "The selected activities have been successfully rescheduled."
    : `Schedule regeneration failed: ${
        errorMessage || "Unknown error occurred"
      }`;
  const type = isSuccess ? "success" : "error";

  return createNotification(userId, title, message, type, {
    action: "view_schedule",
    status,
  });
}

module.exports = {
  createNotification,
  createScheduleGenerationNotification,
  createScheduleRegenerationNotification,
};
