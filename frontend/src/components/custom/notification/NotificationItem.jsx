import React from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/context/NotificationContext";
import { formatNotificationTime } from "@/util/dateUtils";
import { Bell, Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const NotificationItem = ({ notification }) => {
  const navigate = useNavigate();
  const { markAsRead, deleteNotification } = useNotifications();

  const handleClick = () => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    deleteNotification(notification._id);
  };

  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4 hover:bg-accent/50 cursor-pointer transition-colors",
        !notification.isRead && "bg-accent/30"
      )}
      onClick={handleClick}
    >
      <div className="flex-shrink-0">
        <Bell
          className={cn(
            "h-5 w-5",
            notification.severity === "error" && "text-destructive",
            notification.severity === "success" && "text-green-500",
            notification.severity === "warning" && "text-yellow-500",
            notification.severity === "info" && "text-blue-500"
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-medium leading-none">
            {notification.title}
          </h4>
          <span className="text-xs text-muted-foreground">
            {formatNotificationTime(notification.timestamp)}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
          {notification.message}
        </p>
        {notification.actionUrl && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(notification.actionUrl);
            }}
            className="mt-2 text-xs text-primary hover:underline"
          >
            {notification.actionLabel || "View Details"}
          </button>
        )}
      </div>
      <div className="flex-shrink-0 flex gap-2">
        {!notification.isRead && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              markAsRead(notification._id);
            }}
            className="p-1 hover:bg-accent rounded-full"
          >
            <Check className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={handleDelete}
          className="p-1 hover:bg-accent rounded-full"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default NotificationItem;
