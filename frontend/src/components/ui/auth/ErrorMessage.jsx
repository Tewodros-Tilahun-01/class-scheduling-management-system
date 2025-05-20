import React from "react";
import { AlertCircle } from "lucide-react";

const ErrorMessage = ({ message }) => {
  return (
    <div className="flex items-center gap-2 text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg">
      <AlertCircle size={16} />
      <span>{message}</span>
    </div>
  );
};

export default ErrorMessage;
