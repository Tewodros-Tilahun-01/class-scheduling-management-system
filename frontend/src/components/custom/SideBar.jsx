import { useContext, useRef, useState, useEffect } from "react";
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
  Group,
  User,
  ChevronDown,
} from "lucide-react";
import clsx from "clsx";
import { MenuContext } from "@/hooks/MenuProvider";
import ProfilePanel from "./ProfilePanel";
import { useAuth } from "@/context/AuthContext";

function SideBar({ className }) {
  const { toggleMenu, isOpen } = useContext(MenuContext);
  const { user } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const panelRef = useRef(null);
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
  const toggleProfilePanel = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  return (
    <div className={clsx(className, "flex flex-col min-h-screen px-6")}>
      <div className="">
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
      <div className="mt-auto">
        <div
          onClick={toggleProfilePanel}
          className={clsx(
            "relative flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-slate-100",
            isProfileOpen && "bg-slate-100"
          )}
        >
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt="Profile"
              className="w-full h-ful rounded-full object-cover border-2 border-white shadow-sm"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <User size={20} />
            </div>
          )}

          {!isOpen && (
            <>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-700 truncate">
                  {user?.name || "Guest"}
                </p>
                <p className="text-xs text-slate-500 capitalize truncate">
                  {user?.role || "User"}
                </p>
              </div>
              <ChevronDown
                size={16}
                className={`text-slate-400 transition-transform duration-200 ${
                  isProfileOpen ? "rotate-180" : ""
                }`}
              />
            </>
          )}

          <ProfilePanel
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            panelRef={panelRef}
          />
        </div>
      </div>
    </div>
  );
}

export default SideBar;
