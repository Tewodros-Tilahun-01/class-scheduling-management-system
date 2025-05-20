import React from "react";
import { Loader2 } from "lucide-react";

const LoadingOverlay = () => {
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-50">
      <div className="bg-white/80 rounded-lg p-4">
        <Loader2 className="animate-spin text-purple-500" size={32} />
      </div>
    </div>
  );
};

export default LoadingOverlay;
