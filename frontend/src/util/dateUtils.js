export const formatNotificationTime = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return diffInDays === 1 ? "Yesterday" : `${diffInDays}d ago`;
  }

  // If more than a week ago, show the date
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
};

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

export const groupNotificationsByDate = (notifications) => {
  // Sort notifications by date (newest first)
  const sortedNotifications = [...notifications].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  // Group into "Today", "Yesterday", and "Earlier"
  const groups = [];

  const todayNotifications = sortedNotifications.filter((n) =>
    isToday(n.timestamp)
  );
  if (todayNotifications.length > 0) {
    groups.push({
      label: "Today",
      notifications: todayNotifications,
    });
  }

  const yesterdayNotifications = sortedNotifications.filter((n) =>
    isYesterday(n.timestamp)
  );
  if (yesterdayNotifications.length > 0) {
    groups.push({
      label: "Yesterday",
      notifications: yesterdayNotifications,
    });
  }

  const earlierNotifications = sortedNotifications.filter(
    (n) => !isToday(n.timestamp) && !isYesterday(n.timestamp)
  );
  if (earlierNotifications.length > 0) {
    groups.push({
      label: "Earlier",
      notifications: earlierNotifications,
    });
  }

  return groups;
};
