import { createBrowserRouter } from "react-router-dom";
import DashBoard from "../pages/DashBoard";
import Lectures from "../pages/Lectures";
import Course from "../pages/Course";
import Activity from "../pages/Activity";
import RescheduleActivities from "../components/custom/RescheduleActivities";
import Room from "../pages/Room";
import { StudentGroup } from "../pages/StudentGroup";
import ScheduleTable from "../pages/ScheduleTable";
import LectureSchedule from "../pages/LectureSchedule";
import FreeRooms from "../pages/FreeRooms";
import Login from "../pages/Login";
import AppLayout from "@/layouts/AppLayout";
import ManagerRips from "@/pages/ManagerRips";
import Users from "@/pages/Users";
import TimeslotManager from "@/pages/TimeslotManager";
import ProfilePage from "@/pages/Profile";
import ActivityStats from "@/pages/ActivityStats";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AppLayout>
        <DashBoard />
      </AppLayout>
    ),
  },
  {
    path: "lectures",
    element: (
      <AppLayout>
        <Lectures />
      </AppLayout>
    ),
  },
  {
    path: "course",
    element: (
      <AppLayout>
        <Course />
      </AppLayout>
    ),
  },
  {
    path: "activity",
    element: (
      <AppLayout>
        <Activity />
      </AppLayout>
    ),
  },
  {
    path: "rooms",
    element: (
      <AppLayout>
        <Room />
      </AppLayout>
    ),
  },
  {
    path: "student-group",
    element: (
      <AppLayout>
        <StudentGroup />
      </AppLayout>
    ),
  },
  {
    path: "schedules/:semester",
    element: (
      <AppLayout>
        <ScheduleTable />
      </AppLayout>
    ),
  },
  {
    path: "schedules/:semester/lectures",
    element: (
      <AppLayout>
        <LectureSchedule />
      </AppLayout>
    ),
  },
  {
    path: "schedules/:semester/free-rooms",
    element: (
      <AppLayout>
        <FreeRooms />
      </AppLayout>
    ),
  },
  {
    path: "schedules/:semesterid/regenerateSchedule",
    element: (
      <AppLayout>
        <RescheduleActivities />
      </AppLayout>
    ),
  },

  {
    path: "manage-rips",
    element: (
      <AppLayout>
        <ManagerRips />
      </AppLayout>
    ),
  },
  {
    path: "user",
    element: (
      <AppLayout>
        <Users />
      </AppLayout>
    ),
  },
  {
    path: "TimeslotManager",
    element: (
      <AppLayout>
        <TimeslotManager />
      </AppLayout>
    ),
  },
  {
    path: "profile",
    element: (
      <AppLayout>
        <ProfilePage />
      </AppLayout>
    ),
  },
  {
    path: "activity/schedule-stats/:semester",
    element: (
      <AppLayout>
        <ActivityStats />
      </AppLayout>
    ),
  },
  {
    path: "login",
    element: (
      <AppLayout>
        <Login />
      </AppLayout>
    ),
  },
]);

export default router;
