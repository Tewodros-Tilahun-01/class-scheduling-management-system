import { createContext, useContext, useState, useEffect } from "react";
import { generateMockNotifications } from "../util/mockData";

const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  selectedFilter: "all",
  setSelectedFilter: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  deleteNotification: () => {},
  clearAll: () => {},
  getFilteredNotifications: () => [],
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Load mock notifications
    const mockNotifications = generateMockNotifications();
    setNotifications(mockNotifications);
  }, []);

  useEffect(() => {
    // Update unread count whenever notifications change
    setUnreadCount(notifications.filter((n) => !n.isRead).length);
  }, [notifications]);

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, isRead: true }))
    );
  };

  const deleteNotification = (id) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getFilteredNotifications = () => {
    if (selectedFilter === "all") {
      return notifications;
    } else if (selectedFilter === "unread") {
      return notifications.filter((notification) => !notification.isRead);
    } else {
      return notifications.filter(
        (notification) => notification.type === selectedFilter
      );
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        selectedFilter,
        setSelectedFilter,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        getFilteredNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
