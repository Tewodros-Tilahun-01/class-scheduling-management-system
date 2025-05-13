import React, { InputHTMLAttributes } from "react";

const InputField = ({ placeholder, ...props }) => {
  return (
    <input
      className="w-full px-4 py-3 rounded-lg bg-[#f0fff7] border border-transparent outline-none mb-4 text-gray-700 placeholder-gray-500 focus:border-[#00ff94] transition-colors"
      placeholder={placeholder}
      {...props}
    />
  );
};

export default InputField;
