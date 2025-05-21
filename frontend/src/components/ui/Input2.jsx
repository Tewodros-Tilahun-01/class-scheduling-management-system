import React from "react";
import { cn } from "../../lib/utils";

const Input = React.forwardRef(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      onChange,
      ...props
    },
    ref
  ) => {
    const id = React.useId();

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              {leftIcon}
            </div>
          )}
          <input
            id={id}
            className={cn(
              "block w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 text-sm transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              error && "border-red-500 focus:ring-red-500 focus:border-red-500",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className
            )}
            onChange={onChange}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
