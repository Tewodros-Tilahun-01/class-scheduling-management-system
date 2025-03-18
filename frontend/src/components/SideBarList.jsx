import { ChevronRight } from "lucide-react";
import React from "react";

function SideBarList({ menu }) {
  const notList = { Logout: true };
  return (
    <a
      href={menu.link}
      className={`flex gap-4 px-2 py-2  items-center
        
         rounded-sm
        ${
          menu.text == "Rooms"
            ? "bg-green-200 text-green-500 font-bold "
            : "text-gray-400"
        }`}
    >
      {menu.icon}

      <span className="capitalize">{menu.text}</span>
      <span className=" ml-auto">
        {menu.text in notList ? "" : <ChevronRight size={22} />}
      </span>
    </a>
  );
}

export default SideBarList;
