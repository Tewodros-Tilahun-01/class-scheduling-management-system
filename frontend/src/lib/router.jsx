// router.jsx or wherever you're defining routes
import { createBrowserRouter } from "react-router-dom";
import DashBoard from "../pages/DashBoard";
import Lectures from "../pages/Lectures";
import Course from "../pages/Course";
import Activity from "../pages/Activity";
import Room from "../pages/Room";
import { StudentGroup } from "../pages/StudentGroup";
import ScheduleTable from "../pages/ScheduleTable";
import Login from "../pages/Login";
import AppLayout from "@/layouts/AppLayout";
import ManagerRips from "@/pages/ManagerRips";
import Users from "@/pages/Users";
import TimeslotManager from "@/pages/TimeslotManager";
import ProfilePage from "@/pages/Profile";

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
    path: "login",
    element: (
      <AppLayout>
        <Login />
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
]);

export default router;
