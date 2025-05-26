import React from "react";
import { useNotifications } from "@/context/NotificationContext";
import {
  Bell,
  CheckCircle2,
  Info,
  AlertTriangle,
  AlertCircle,
  MessageSquare,
  Server,
  Trash2,
} from "lucide-react";

const NotificationHeader = () => {
  const {
    unreadCount,
    selectedFilter,
    setSelectedFilter,
    markAllAsRead,
    clearAll,
    notifications,
  } = useNotifications();

  const filterOptions = [
    { label: "All", value: "all", icon: <Bell className="h-4 w-4" /> },
    {
      label: "Unread",
      value: "unread",
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
  ];

  return (
    <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">
              {notifications.length} Total
            </span>
            {unreadCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {unreadCount} Unread
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              unreadCount === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-green-700 hover:bg-green-50 border border-green-200 hover:border-green-300 shadow-sm hover:shadow"
            }`}
          >
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            Mark all read
          </button>

          <button
            onClick={clearAll}
            disabled={notifications.length === 0}
            className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              notifications.length === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-red-700 hover:bg-red-50 border border-red-200 hover:border-red-300 shadow-sm hover:shadow"
            }`}
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Clear all
          </button>
        </div>
      </div>

      <div className="flex overflow-x-auto py-1 -mx-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        <div className="flex space-x-2 px-1">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedFilter(option.value)}
              className={`inline-flex items-center px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedFilter === option.value
                  ? "bg-green-600 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow"
              }`}
            >
              <span className="mr-1.5">{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationHeader;
