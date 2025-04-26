import ActivityScheduler from "@/components/custom/ActivityScheduler";
import DashboardLayout from "@/layouts/DashboardLayout";
import React from "react";

function Activity() {
  return (
    <div>
      <DashboardLayout>
        <ActivityScheduler />
      </DashboardLayout>
    </div>
  );
}

export default Activity;
