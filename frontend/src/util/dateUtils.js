/**
 * Formats a date into a relative time string (e.g., "2 hours ago")
 * @param {Date|string} date - The date to format
 * @returns {string} The formatted date string
 */
export function formatNotificationTime(date) {
  if (!date) return "";

  // Convert string to Date if needed
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    console.error("Invalid date:", date);
    return "";
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now - dateObj) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
  }

  // If more than a week ago, return the actual date
  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Groups notifications by date
 * @param {Array} notifications - Array of notification objects
 * @returns {Array} Array of grouped notifications
 */
export function groupNotificationsByDate(notifications) {
  if (!notifications || !Array.isArray(notifications)) {
    return [];
  }

  const groups = {};
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  notifications.forEach((notification) => {
    if (!notification.timestamp) return;

    const date = new Date(notification.timestamp);
    if (isNaN(date.getTime())) {
      console.error("Invalid notification timestamp:", notification.timestamp);
      return;
    }

    let label;
    if (date.toDateString() === today.toDateString()) {
      label = "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      label = "Yesterday";
    } else {
      label = date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }

    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(notification);
  });

  return Object.entries(groups).map(([label, notifications]) => ({
    label,
    notifications,
  }));
}

export const isToday = (date) => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export const isYesterday = (date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
};
