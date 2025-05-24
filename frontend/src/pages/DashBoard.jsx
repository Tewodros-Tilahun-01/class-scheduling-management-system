import React, { useState, useEffect } from "react";
import StateCard from "@/components/custom/StateCard";
import {
  Users,
  BookOpen,
  GraduationCap,
  User,
  House,
  Loader2,
} from "lucide-react";
import DashboardLayout from "@/layouts/DashboardLayout";
import SemesterList from "../components/custom/SemesterList";
import { fetchDashboardStats } from "@/services/api";
import { toast } from "@/components/ui/sonner";

function DashBoard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const data = await fetchDashboardStats();
        setStats([
          {
            icon: <User className="text-green-500" size={30} />,
            label: "Lectures",
            value: data.lectures,
          },
          {
            icon: <Users className="text-green-500" size={30} />,
            label: "Student Groups",
            value: data.studentGroups,
          },
          {
            icon: <BookOpen className="text-green-500" size={30} />,
            label: "Courses",
            value: data.courses,
          },
          {
            icon: <House className="text-green-500" size={30} />,
            label: "Rooms",
            value: data.rooms,
          },
        ]);
        toast.success("Statistics loaded successfully");
      } catch (error) {
        toast.error("Failed to load statistics", {
          description: error.message,
        });
        setStats([
          {
            icon: <User className="text-green-500" size={30} />,
            label: "Lectures",
            value: 0,
          },
          {
            icon: <Users className="text-green-500" size={30} />,
            label: "Student Groups",
            value: 0,
          },
          {
            icon: <BookOpen className="text-green-500" size={30} />,
            label: "Courses",
            value: 0,
          },
          {
            icon: <House className="text-green-500" size={30} />,
            label: "Rooms",
            value: 0,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <DashboardLayout>
      <div className="p-8 w-full">
        <ul className="w-full bg-white flex gap-6 px-4 py-6 rounded-md shadow-sm">
          {loading ? (
            <div className="flex justify-center items-center w-full py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            stats.map((state) => (
              <li key={state.label} className="flex-1">
                <StateCard state={state} />
              </li>
            ))
          )}
        </ul>
      </div>
      <SemesterList />
    </DashboardLayout>
  );
}

export default DashBoard;
