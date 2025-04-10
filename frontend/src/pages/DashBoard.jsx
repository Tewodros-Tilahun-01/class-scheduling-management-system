import { DataTableDemo } from "@/components/custom/DataTableDemo";
import StateCard from "@/components/custom/StateCard";
import { Users, BookOpen, GraduationCap, User } from "lucide-react";
import Header from "../components/custom/Header";
import DashboardLayout from "@/layouts/DashboardLayout";

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

  const data = [
    { id: 1, name: "John Doe", email: "john.doe@example.com" },
    { id: 2, name: "Jane Smith", email: "jane.smith@example.com" },
    { id: 3, name: "Alice Johnson", email: "alice.johnson@example.com" },
    { id: 4, name: "Bob Williams", email: "bob.williams@example.com" },
  ];
  return (
    <DashboardLayout>
      <div className="bg-gray-100 px-14">
        <Header className="bg-gray-100 px-14 py-8" />
        <ul className="w-full bg-white flex gap-6 px-4 py-6 rounded-md shadow-sm">
          {stats.map((state) => (
            <li key={state.label} className="flex-1">
              <StateCard state={state} />
            </li>
          ))}
        </ul>
        <DataTableDemo />
      </div>
    </DashboardLayout>
  );
}

export default DashBoard;
