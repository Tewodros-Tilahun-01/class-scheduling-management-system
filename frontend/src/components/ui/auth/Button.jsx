import React from "react";
import { ArrowRight } from "lucide-react";

const Button = ({ children, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-purple-400 to-yellow-300 text-black font-medium font-quicksand flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
    >
      {children}
      <ArrowRight size={20} />
    </button>
  );
};

export default Button;
