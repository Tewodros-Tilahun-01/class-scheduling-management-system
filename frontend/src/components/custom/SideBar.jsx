import { useContext } from "react";
import SideBarCard from "./SideBarCard";
import {
  Bolt,
  Home,
  Book,
  DoorOpen,
  BookAIcon,
  SquareChevronDown,
  Group,
  User,
  Clock2Icon,
} from "lucide-react";
import clsx from "clsx";
import { MenuContext } from "@/hooks/MenuProvider";
import { useAuth } from "@/context/AuthContext";

function SideBar({ className }) {
  const { toggleMenu, isOpen } = useContext(MenuContext);
  const { user } = useAuth();

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
      text: "Student Group",
      icon: <SquareChevronDown size={24} />,
    },
    {
      link: "/user",
      text: "Users",
      icon: <User size={24} />,
    },
    {
      link: "/manage-rips",
      text: "Manage Rips",
      icon: <Group size={24} />,
    },
    {
      link: "/activity",
      text: "Activity",
      icon: <SquareChevronDown size={24} />,
    },
    {
      link: "/timeslotmanager",
      text: "Timeslot",
      icon: <Clock2Icon size={24} />,
    },
  ];
  const filteredMenus = menus.filter((menu) => {
    if (!user) return true;

    if (
      (menu.text === "Users" || menu.text === "Manage Rips") &&
      (user.role === "apo" || user.role === "user")
    ) {
      return false;
    }

    if (
      (menu.text === "Activity" || menu.text === "Student Group") &&
      user.role === "admin"
    ) {
      return false;
    }

    return true;
  });

  return (
    <div className={clsx(className, "flex flex-col min-h-screen px-6")}>
      <div className="sticky top-8">
        <h2 className="flex flex-row items-center justify-between gap-3 text-3xl px-2 py-2">
          <Bolt size={30} onClick={() => toggleMenu(!isOpen)} />
          <span
            className={`capitalize text-xl flex-1 transition-all ${
              isOpen && "hidden"
            }`}
          >
            settings
          </span>
        </h2>
        {/* Scrollable menu area */}
        <ul className="flex-1 overflow-y-auto mt-8 flex flex-col gap-5">
          {filteredMenus.map((menu) => (
            <li key={menu.text}>
              <SideBarCard menu={menu} />
            </li>
          ))}
        </ul>
      </div>
      {/* User details pinned to bottom */}
    </div>
  );
}

export default SideBar;
