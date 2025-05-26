import {
  Info,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  MessageSquare,
  Server,
} from "lucide-react";

const NotificationIcon = ({ type, className = "h-5 w-5" }) => {
  const getIconColor = () => {
    switch (type) {
      case "info":
        return "text-blue-500";
      case "success":
        return "text-green-500";
      case "warning":
        return "text-amber-500";
      case "error":
        return "text-red-500";
      case "message":
        return "text-indigo-500";
      case "system":
        return "text-gray-500";
      default:
        return "text-gray-400";
    }
  };

  const iconClass = `${className} ${getIconColor()}`;

  switch (type) {
    case "info":
      return <Info className={iconClass} />;
    case "success":
      return <CheckCircle className={iconClass} />;
    case "warning":
      return <AlertTriangle className={iconClass} />;
    case "error":
      return <AlertCircle className={iconClass} />;
    case "message":
      return <MessageSquare className={iconClass} />;
    case "system":
      return <Server className={iconClass} />;
    default:
      return <Info className={iconClass} />;
  }
};

export default NotificationIcon;
