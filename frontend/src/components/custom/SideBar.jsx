import { useContext } from "react";
import SideBarCard from "./SideBarCard";
import {
  Bolt,
  Home,
  Book,
  DoorOpen,
  HelpCircle,
  LogOut,
  BookAIcon,
  SquareChevronDown,
} from "lucide-react";
import clsx from "clsx";
import { MenuContext } from "@/hooks/MenuProvider";

function SideBar({ className }) {
  const { toggleMenu, isOpen } = useContext(MenuContext);
  const menus = [
    {
      link: "/",
      text: "DashBoard",
      icon: <Home size={24} />,
    },
    {
      link: "/lectures",
      text: "Lectures",
      icon: <Book size={24} />,
    },
    {
      link: "/rooms",
      text: "Rooms",
      icon: <DoorOpen size={24} />,
    },
    { link: "/course", text: "course", icon: <BookAIcon size={24} /> },
    {
      link: "/student-group",
      text: "student group",
      icon: <SquareChevronDown size={24} />,
    },
    {
      link: "/activity",
      text: "activity",
      icon: <SquareChevronDown size={24} />,
    },

    {
      link: "/logout",
      text: "Logout",
      icon: <LogOut size={24} />,
    },
  ];

  return (
    <div className={clsx(className, isOpen ? "flex   px-6" : " px-6")}>
      <div className="sticky top-10 ">
        <h2 className="flex flex-row items-center justify-between gap-3 text-3xl  px-2 py-2">
          <Bolt size={30} onClick={() => toggleMenu(!isOpen)} />
          <span
            className={`capitalize text-xl flex-1 transition-all ${
              isOpen && "hidden"
            }`}
          >
            Dashboard
          </span>
        </h2>
        <ul className="mt-10 flex flex-col gap-6">
          {menus.map((menu) => {
            return (
              <li key={menu.text}>
                <SideBarCard menu={menu} />
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default SideBar;
