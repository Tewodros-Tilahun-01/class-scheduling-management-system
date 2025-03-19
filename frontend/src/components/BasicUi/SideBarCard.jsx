import { ChevronRight } from "lucide-react";
import { useContext } from "react";
import { MenuContext } from "../hooks/MenuProvider";

function SideBarList({ menu }) {
  const { isOpen } = useContext(MenuContext);
  const notList = { Logout: true };
  return (
    <a
      href={menu.link}
      className={`flex gap-4 px-2 py-2 items-center
        hover:bg-green-100 hover:text-green-400 
         rounded-sm 
        ${
          menu.text == "Rooms"
            ? "bg-green-200 text-green-500 font-bold "
            : "text-gray-600"
        }`}
    >
      {menu.icon}

      <span className={` capitalize transition-all ${isOpen && "hidden"}`}>
        {menu.text}
      </span>
      <span className={` ml-auto transition-all ${isOpen && "hidden"}`}>
        {menu.text in notList ? "" : <ChevronRight size={22} />}
      </span>
    </a>
  );
}

export default SideBarList;
