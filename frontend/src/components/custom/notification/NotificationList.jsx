import { useNotifications } from "@/context/NotificationContext";
import NotificationItem from "./NotificationItem";
import EmptyState from "@/components/ui/EmptyState";
import { groupNotificationsByDate } from "@/util/dateUtils";

const NotificationList = () => {
  const { getFilteredNotifications } = useNotifications();
  const filteredNotifications = getFilteredNotifications();
  const groupedNotifications = groupNotificationsByDate(filteredNotifications);

  if (filteredNotifications.length === 0) {
    return (
      <EmptyState
        icon="bell"
        title="No notifications"
        description="You're all caught up! Check back later for new notifications."
      />
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {groupedNotifications.map((group) => (
        <div key={group.label}>
          <div className="px-6 py-3 bg-gray-50/80">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {group.label}
            </h3>
          </div>
          <div>
            {group.notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationList;
