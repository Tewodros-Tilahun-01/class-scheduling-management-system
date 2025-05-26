import React from "react";
import { Bell, Search, Filter, AlertCircle } from "lucide-react";

const EmptyState = ({ icon, title, description, action }) => {
  const renderIcon = () => {
    const iconClass = "h-12 w-12 text-gray-400";

    switch (icon) {
      case "bell":
        return <Bell className={iconClass} />;
      case "search":
        return <Search className={iconClass} />;
      case "filter":
        return <Filter className={iconClass} />;
      case "error":
        return <AlertCircle className={iconClass} />;
      default:
        return <Bell className={iconClass} />;
    }
  };

  return (
    <div className="text-center py-16 px-4">
      <div className="inline-flex items-center justify-center p-3 bg-gray-100 rounded-full mb-4">
        {renderIcon()}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
        {description}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
