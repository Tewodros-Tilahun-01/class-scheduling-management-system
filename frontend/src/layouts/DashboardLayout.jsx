import Header from "@/components/custom/Header";
import SideBar from "@/components/custom/SideBar";
import React from "react";
import { useLocation } from "react-router-dom";

function DashboardLayout({ children }) {
  const location = useLocation();
  const hideHeaderRoutes = ["/profile", "/notification"];
  const shouldHideHeader = hideHeaderRoutes.some(
    (route) => location.pathname === route
  );

  return (
    <div className="grid grid-cols-[auto_1fr] min-h-screen ">
      <SideBar className={"py-8"} />
      <div className="bg-gray-100">
        {!shouldHideHeader && <Header className="pt-4 " />}
        {children}
      </div>
    </div>
  );
}

export default DashboardLayout;
