import RepresentativeList from "@/components/custom/RepresentativeList";
import RepresentativeManagement from "@/components/custom/RepresentativeManagement";
import DashboardLayout from "@/layouts/DashboardLayout";
import React from "react";

export default function ManagerRips() {
  return (
    <DashboardLayout>
      <div className="">
        <RepresentativeManagement />
        <RepresentativeList />
      </div>
    </DashboardLayout>
  );
}
