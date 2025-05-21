import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../../ui/Card2";
import Badge from "../../ui/Badge";
import { Clock } from "lucide-react";

const ActivitySection = ({ activities }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute top-0 bottom-0 left-4 border-l-2 border-gray-200" />

          <ul className="space-y-6">
            {activities.map((activity) => (
              <li key={activity.id} className="relative pl-10">
                <div className="absolute left-0 top-1 h-8 w-8 rounded-full flex items-center justify-center bg-white border-2 border-gray-200">
                  <ActivityIcon type={activity.type} />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {activity.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {activity.status && (
                      <Badge
                        variant={
                          activity.status === "success"
                            ? "success"
                            : activity.status === "warning"
                            ? "warning"
                            : "danger"
                        }
                      >
                        {activity.status}
                      </Badge>
                    )}
                    <span className="flex items-center text-xs text-gray-500">
                      <Clock size={12} className="mr-1" />
                      {activity.timestamp}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

const ActivityIcon = ({ type }) => {
  switch (type) {
    case "login":
      return <span className="text-blue-500">🔐</span>;
    case "update":
      return <span className="text-green-500">✏️</span>;
    case "report":
      return <span className="text-purple-500">📊</span>;
    case "class":
      return <span className="text-orange-500">📚</span>;
    case "meeting":
      return <span className="text-red-500">📅</span>;
    default:
      return <span className="text-gray-500">📍</span>;
  }
};

export default ActivitySection;
