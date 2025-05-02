import StateCard from "@/components/custom/StateCard";
import { Users, BookOpen, GraduationCap, User } from "lucide-react";
import DashboardLayout from "@/layouts/DashboardLayout";
import SemesterList from "../components/custom/SemesterList";

function DashBoard() {
  const stats = [
    {
      icon: <User className="text-green-500" size={30} />,
      label: "Total Professors",
      value: 5423,
    },
    {
      icon: <Users className="text-green-500" size={30} />,
      label: "Members",
      value: 1893,
    },
    {
      icon: <BookOpen className="text-green-500" size={30} />,
      label: "Courses",
      value: 189,
    },
    {
      icon: <GraduationCap className="text-green-500" size={30} />,
      label: "Classes",
      value: 32,
    },
  ];

  return (
    <DashboardLayout>
      <div className="px-14">
        <ul className="w-full bg-white flex gap-6 px-4 py-6 rounded-md shadow-sm">
          {stats.map((state) => (
            <li key={state.label} className="flex-1">
              <StateCard state={state} />
            </li>
          ))}
        </ul>
      </div>
      <SemesterList />
    </DashboardLayout>
  );
}

export default DashBoard;
