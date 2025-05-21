import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "../../ui/Card2";
import Button from "../../ui/Button2";
import { BellRing, Mail, MessageSquare, Calendar } from "lucide-react";

const NotificationsSection = () => {
  const [notifications, setNotifications] = React.useState({
    email: {
      updates: true,
      newClasses: true,
      reminders: false,
      marketing: false,
    },
    push: {
      updates: true,
      newClasses: true,
      reminders: true,
      marketing: false,
    },
  });

  const handleToggle = (type, setting) => {
    setNotifications((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [setting]: !prev[type][setting],
      },
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <Mail size={16} className="mr-2" />
              Email Notifications
            </h3>
            <div className="space-y-4">
              {Object.entries(notifications.email).map(([key, enabled]) => (
                <div
                  key={`email-${key}`}
                  className="flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      {key === "updates"
                        ? "System Updates"
                        : key === "newClasses"
                        ? "New Classes"
                        : key === "reminders"
                        ? "Calendar Reminders"
                        : "Marketing & Promotions"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {key === "updates"
                        ? "Get notified about system updates and maintenance"
                        : key === "newClasses"
                        ? "Receive alerts when new classes are added"
                        : key === "reminders"
                        ? "Get reminded about upcoming classes and events"
                        : "Receive marketing and promotional materials"}
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      id={`email-${key}`}
                      checked={enabled}
                      onChange={() => handleToggle("email", key)}
                    />
                    <label
                      htmlFor={`email-${key}`}
                      className={`block h-6 w-11 rounded-full transition-colors cursor-pointer ${
                        enabled ? "bg-blue-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`block h-5 w-5 mt-0.5 ml-0.5 rounded-full bg-white shadow transform transition-transform ${
                          enabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <BellRing size={16} className="mr-2" />
              Push Notifications
            </h3>
            <div className="space-y-4">
              {Object.entries(notifications.push).map(([key, enabled]) => (
                <div
                  key={`push-${key}`}
                  className="flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      {key === "updates"
                        ? "System Updates"
                        : key === "newClasses"
                        ? "New Classes"
                        : key === "reminders"
                        ? "Calendar Reminders"
                        : "Marketing & Promotions"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {key === "updates"
                        ? "Get notified about system updates and maintenance"
                        : key === "newClasses"
                        ? "Receive alerts when new classes are added"
                        : key === "reminders"
                        ? "Get reminded about upcoming classes and events"
                        : "Receive marketing and promotional materials"}
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      id={`push-${key}`}
                      checked={enabled}
                      onChange={() => handleToggle("push", key)}
                    />
                    <label
                      htmlFor={`push-${key}`}
                      className={`block h-6 w-11 rounded-full transition-colors cursor-pointer ${
                        enabled ? "bg-blue-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`block h-5 w-5 mt-0.5 ml-0.5 rounded-full bg-white shadow transform transition-transform ${
                          enabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Notification Channels
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center p-3 border border-gray-200 rounded-md">
                <Mail size={18} className="mr-2 text-blue-600" />
                <span className="text-sm">Email</span>
              </div>
              <div className="flex items-center p-3 border border-gray-200 rounded-md">
                <MessageSquare size={18} className="mr-2 text-green-600" />
                <span className="text-sm">SMS</span>
              </div>
              <div className="flex items-center p-3 border border-gray-200 rounded-md">
                <Calendar size={18} className="mr-2 text-purple-600" />
                <span className="text-sm">Calendar</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button variant="outline">Reset to Default</Button>
        <Button>Save Preferences</Button>
      </CardFooter>
    </Card>
  );
};

export default NotificationsSection;
