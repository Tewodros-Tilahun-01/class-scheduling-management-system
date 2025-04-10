import { CourseTable } from "@/components/custom/CourseTable";
import DashboardLayout from "@/layouts/DashboardLayout";
import React from "react";

function Course() {
  return (
    <DashboardLayout>
      <div className="px-14">
        <CourseTable />
      </div>
    </DashboardLayout>
  );
}

export default Course;
