import Header from "@/components/custom/Header";
import SideBar from "@/components/custom/SideBar";
import React from "react";

function DashboardLayout({ children }) {
  return (
    <div className="grid grid-cols-[auto_1fr] h-screen  max-h-screen:">
      <SideBar className={"py-8"} />
      <div className="bg-gray-100">
        <Header className=" px-14 py-8" />
        {children}
      </div>
    </div>
  );
}

export default DashboardLayout;
