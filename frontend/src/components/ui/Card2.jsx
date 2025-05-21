import React from "react";
import { cn } from "../../lib/utils";

export const Card = ({ className, children }) => {
  return (
    <div
      className={cn(
        "bg-white rounded-lg shadow-sm border border-gray-200",
        className
      )}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ className, children }) => {
  return (
    <div className={cn("px-6 py-4 border-b border-gray-200", className)}>
      {children}
    </div>
  );
};

export const CardTitle = ({ className, children }) => {
  return <h3 className={cn("text-lg font-medium", className)}>{children}</h3>;
};

export const CardDescription = ({ className, children }) => {
  return (
    <p className={cn("text-sm text-gray-500 mt-1", className)}>{children}</p>
  );
};

export const CardContent = ({ className, children }) => {
  return <div className={cn("px-6 py-4", className)}>{children}</div>;
};

export const CardFooter = ({ className, children }) => {
  return (
    <div className={cn("px-6 py-4 border-t border-gray-200", className)}>
      {children}
    </div>
  );
};
