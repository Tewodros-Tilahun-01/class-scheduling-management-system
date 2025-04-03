import formatNumber from "@/lib/FormatNumber";
import React from "react";

function StateCard({ state }) {
  return (
    <div className="grid grid-cols-[auto_1fr] grid-rows-[auto_auto] gap-x-4 ">
      <span className="row-span-full flex items-center p-3 rounded-full bg-green-100">
        {state.icon}
      </span>
      <p className="text-gray-400 text-nowrap">{state.label}</p>
      <p className=" font-bold text-xl">{formatNumber(state.value)}</p>
    </div>
  );
}

export default StateCard;
