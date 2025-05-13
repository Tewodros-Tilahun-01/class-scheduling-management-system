import SideBarCard from "./SideBarCard";
import {
  Bolt,
  Home,
  Book,
  DoorOpen,
  LogOut,
  BookAIcon,
  SquareChevronDown,
  User,
  Group,
  ChevronDown,
} from "lucide-react";
import clsx from "clsx";
import { MenuContext } from "@/hooks/MenuProvider";
import { useAuth } from "@/context/AuthContext";
import { useContext, useState, useRef, useEffect } from "react";

function SideBar({ className }) {
  const { toggleMenu, isOpen } = useContext(MenuContext);
  const user = { role: "admin", name: "John Doe", email: "" };
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
    {
      link: "/logout",
      text: "Logout",
      icon: <LogOut size={24} />,
    },
  ];

  const toggleProfilePanel = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target) &&
        panelRef.current &&
        !panelRef.current.contains(event.target)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={clsx(className, isOpen ? "px-6" : "px-6")}>
      <div className="sticky top-10 flex flex-col justify-between h-[calc(100vh-2.5rem)]">
        <div>
          <h2 className="flex flex-row items-center justify-between gap-3 text-3xl px-2 py-2">
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
              if (
                (menu.text === "Users" || menu.text === "Manage Rips") &&
                (user.role === "apo" || user.role === "user")
              ) {
                return null;
              }
              if (
                (menu.text === "Activity" || menu.text === "Student Group") &&
                user.role === "admin"
              ) {
                return null;
              }
              return (
                <li key={menu.text}>
                  <SideBarCard menu={menu} />
                </li>
              );
            })}
          </ul>
        </div>
        {/* User Profile Component */}
        <div className="mb-4 relative" ref={profileRef}>
          <div
            className="flex items-center gap-3 px-2 py-3 cursor-pointer hover:bg-gray-100 rounded-md"
            onClick={toggleProfilePanel}
          >
            <img
              src={user?.image || "https://via.placeholder.com/40"}
              alt="User profile"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className={`flex-1 ${isOpen && "hidden"}`}>
              <p className="font-medium text-gray-800">
                {user?.name || "Mia Hudson"}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {user?.email || "mia@example.com"}
              </p>
            </div>
            <ChevronDown
              size={20}
              className={`transition-transform ${
                isProfileOpen ? "rotate-180" : ""
              } ${isOpen && "hidden"}`}
            />
          </div>
          {isProfileOpen && !isOpen && (
            <div
              ref={panelRef}
              className="absolute bottom-full left-0 w-48 bg-white rounded-lg shadow-lg z-50 mb-2"
            >
              <ul className="flex flex-col gap-1 p-2">
                <li>
                  <a
                    href="/account"
                    className="block px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100 rounded-md"
                  >
                    My account
                  </a>
                </li>
                <li>
                  <a
                    href="/settings"
                    className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    Settings
                  </a>
                </li>
                <li>
                  <a
                    href="/billing"
                    className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    Billing
                  </a>
                </li>
                <li>
                  <a
                    href="/logout"
                    className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    Sign out
                  </a>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SideBar;
