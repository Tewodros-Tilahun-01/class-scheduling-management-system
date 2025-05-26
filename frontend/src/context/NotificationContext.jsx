import { createContext, useContext, useState, useEffect } from "react";
import { generateMockNotifications } from "../util/mockData";
import { getNotifications } from "../services/NotificationService";
import { useAuth } from "./AuthContext";

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
  loading: false,
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  console.log("notifications", notifications);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        if (user?.id) {
          const fetchedNotifications = await getNotifications(user.id);
          setNotifications(fetchedNotifications);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch notifications if auth is not loading and we have a user
    if (!authLoading && user?.id) {
      fetchNotifications();
    }
  }, [user?.id, authLoading]); // Depend on user.id and authLoading

  useEffect(() => {
    // Update unread count whenever notifications change
    setUnreadCount(notifications.filter((n) => !n.isRead).length);
  }, [notifications]);

  const markAsRead = async (id) => {
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
        loading,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
