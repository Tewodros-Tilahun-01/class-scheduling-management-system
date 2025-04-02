import { useContext } from "react";
import SideBarList from "../../BasicUi/SideBarCard";
import {
  Bolt,
  Home,
  Book,
  DoorOpen,
  Users,
  HelpCircle,
  LogOut,
} from "lucide-react";
import clsx from "clsx";
import { MenuContext } from "@/components/hooks/MenuProvider";

function SideBar({ className }) {
  const { toggleMenu, isOpen } = useContext(MenuContext);
  const menus = [
    {
      link: "/dashboard",
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
    { link: "/class", text: "Class", icon: <Users size={24} /> },
    {
      link: "/help",
      text: "Help",
      icon: <HelpCircle size={24} />,
    },
    {
      link: "/logout",
      text: "Logout",
      icon: <LogOut size={24} />,
    },
  ];

  return (
    <div
      className={clsx(className, isOpen ? "flex items-center px-3" : "px-6")}
    >
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
              <SideBarList menu={menu} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default SideBar;
