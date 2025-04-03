import SideBar from "@/components/custom/SideBar";
import React from "react";

function DashboardLayout({ children }) {
  return (
    <div className="grid grid-cols-[auto_1fr] grid-rows-[auto_1fr] h-screen ">
      <SideBar className={"py-8"} />

      {children}
    </div>
  );
}

export default DashboardLayout;
