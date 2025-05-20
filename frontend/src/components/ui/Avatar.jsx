import React from "react";
import { cn } from "../../lib/utils";

const Avatar = ({ src, alt = "Avatar", size = "md", className, fallback }) => {
  const [imgError, setImgError] = React.useState(false);

  const handleError = () => {
    setImgError(true);
  };

  const sizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
    xl: "h-24 w-24",
  };

  const fontSize = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-lg",
    xl: "text-2xl",
  };

  const renderFallback = () => {
    if (!fallback) return null;

    const initials = fallback
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    return (
      <span
        className={cn(
          "flex items-center justify-center font-medium text-gray-700",
          fontSize[size]
        )}
      >
        {initials}
      </span>
    );
  };

  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden bg-gray-200 flex items-center justify-center",
        sizes[size],
        className
      )}
    >
      {src && !imgError ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={handleError}
        />
      ) : (
        renderFallback()
      )}
    </div>
  );
};

export default Avatar;
