import React from "react";
import NotificationIcon from "./NotificationIcon";
import { CheckCircle2, Trash2, ExternalLink } from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import { formatNotificationTime } from "@/util/dateUtils";
import { useNavigate } from "react-router-dom";

const NotificationItem = ({ notification }) => {
  const { markAsRead, deleteNotification } = useNotifications();
  const navigate = useNavigate();

  const handleMarkAsRead = (e) => {
    e.stopPropagation();
    markAsRead(notification._id);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    deleteNotification(notification._id);
  };

  const handleClick = () => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    if (notification.metadata?.status === "failed") {
      navigate("/activity");
    }
    // Handle action based on metadata
    if (notification.metadata?.action === "view_schedule") {
      navigate("/");
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group px-6 py-4 border-b border-gray-100 transition-all duration-200 hover:bg-gray-50 cursor-pointer ${
        notification.isRead ? "bg-white" : "bg-green-50"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">
          <div
            className={`p-2 rounded-lg ${
              notification.isRead ? "bg-gray-100" : "bg-blue-100"
            }`}
          >
            <NotificationIcon type={notification.type} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h4
              className={`text-sm font-semibold ${
                notification.isRead ? "text-gray-900" : "text-blue-900"
              }`}
            >
              {notification.title}
            </h4>
            <span className="text-xs font-medium text-gray-500 whitespace-nowrap ml-4">
              {formatNotificationTime(new Date(notification.timestamp))}
            </span>
          </div>

          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
            {notification.message}
          </p>

          {notification.metadata?.action && (
            <div className="mt-2.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
                className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                {notification.metadata.action === "view_schedule"
                  ? "View Schedule"
                  : "View details"}
                <ExternalLink className="ml-1 h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex justify-end items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
        {!notification.isRead && (
          <button
            onClick={handleMarkAsRead}
            className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            Mark as read
          </button>
        )}
        <button
          onClick={handleDelete}
          className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Delete
        </button>
      </div>
    </div>
  );
};

export default NotificationItem;
