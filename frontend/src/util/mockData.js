export const generateMockNotifications = () => {
  const now = new Date();

  // Today's notifications
  const today = [
    {
      id: 1,
      title: "New Course Assignment",
      message:
        'You have been assigned to teach "Introduction to Computer Science" for the Spring 2025 semester.',
      type: "info",
      isRead: false,
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      actionUrl: "/courses/intro-cs",
      actionLabel: "View Course",
    },
    {
      id: 2,
      title: "System Maintenance",
      message:
        "The system will be undergoing maintenance tonight from 2:00 AM to 4:00 AM UTC.",
      type: "system",
      isRead: false,
      timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
    },
    {
      id: 3,
      title: "Message from Dean",
      message:
        "Please review the updated faculty meeting schedule for next month.",
      type: "message",
      isRead: true,
      timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 hours ago
      sender: {
        name: "Dr. Michael Chen",
        avatar: "",
      },
    },
  ];

  // Yesterday's notifications
  const yesterday = [
    {
      id: 4,
      title: "Room Booking Confirmed",
      message:
        "Your booking for Room 302 on Wednesday, July 15th has been confirmed.",
      type: "success",
      isRead: true,
      timestamp: new Date(
        now.getTime() - 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000
      ), // Yesterday, 2 hours after today's time
      actionUrl: "/rooms/bookings",
      actionLabel: "View Booking",
    },
    {
      id: 5,
      title: "Grade Submission Reminder",
      message: "Please submit final grades for CSC101 by Friday, July 17th.",
      type: "warning",
      isRead: false,
      timestamp: new Date(
        now.getTime() - 24 * 60 * 60 * 1000 - 5 * 60 * 60 * 1000
      ), // Yesterday, 5 hours after today's time
    },
  ];

  // Earlier notifications
  const earlier = [
    {
      id: 6,
      title: "Account Settings Updated",
      message: "Your account settings have been updated successfully.",
      type: "success",
      isRead: true,
      timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
    {
      id: 7,
      title: "New Student Group Created",
      message:
        'A new student group "AI Research Club" has been created and assigned to your department.',
      type: "info",
      isRead: true,
      timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      actionUrl: "/groups/ai-research",
      actionLabel: "View Group",
    },
    {
      id: 8,
      title: "System Error Detected",
      message:
        "An error occurred while syncing your calendar with the university system. The IT department has been notified.",
      type: "error",
      isRead: true,
      timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
  ];

  return [...today, ...yesterday, ...earlier];
};
