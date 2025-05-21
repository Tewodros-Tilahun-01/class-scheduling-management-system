import { useRef, useEffect } from "react";
import { LogOut, Settings, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { NavLink } from "react-router-dom";

const ProfilePanel = ({ isOpen, onClose, panelRef }) => {
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, panelRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute bottom-full left-0 mb-2 w-60 rounded-lg bg-white shadow-lg border border-slate-200 overflow-hidden transition-all duration-300 origin-bottom-left"
    >
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <img
            src={
              user?.avatar ||
              "https://images.pexels.com/photos/3775534/pexels-photo-3775534.jpeg?auto=compress&cs=tinysrgb&w=600"
            }
            alt="Profile"
            className="h-10 w-10 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-800 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="p-2">
        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md transition-colors">
          <User size={16} />
          <NavLink to="/profile">Profile</NavLink>
        </button>
        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md transition-colors">
          <Settings size={16} />
          <span>Settings</span>
        </button>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default ProfilePanel;
