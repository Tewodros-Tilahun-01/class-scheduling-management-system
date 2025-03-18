import React from "react";
import SideBarList from "./SideBarList";
import {
  Bolt,
  Home,
  Book,
  DoorOpen,
  Users,
  HelpCircle,
  LogOut,
} from "lucide-react";

function SideBar({ className }) {
  const menus = [
    {
      link: "/dashboard",
      text: "DashBoard",
      icon: <Home size={24} color={"gray"} />,
    },
    {
      link: "/lectures",
      text: "Lectures",
      icon: <Book size={24} color={"gray"} />,
    },
    {
      link: "/rooms",
      text: "Rooms",
      icon: <DoorOpen size={24} />,
    },
    { link: "/class", text: "Class", icon: <Users size={24} color={"gray"} /> },
    {
      link: "/help",
      text: "Help",
      icon: <HelpCircle size={24} color={"gray"} />,
    },
    {
      link: "/logout",
      text: "Logout",
      icon: <LogOut size={24} color={"gray"} />,
    },
  ];

  return (
    <div className={`${className}`}>
      <h2 className="flex flex-row items-center justify-between gap-3 text-3xl">
        <Bolt size={30} />
        <span className="capitalize mb-1">Dashboard</span>
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
