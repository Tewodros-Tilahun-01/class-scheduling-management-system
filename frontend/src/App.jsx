import DashBoard from "./pages/DashBoard";
import { MenuProvider } from "./hooks/MenuProvider";

import { createBrowserRouter, RouterProvider } from "react-router";
import Lectures from "./pages/Lectures";
import course from "./pages/Course";
import Activity from "./pages/Activity";
import Room from "./pages/Room";
import { StudentGroup } from "./pages/StudentGroup";
import ScheduleTable from "./pages/ScheduleTable";
let router = createBrowserRouter([
  {
    path: "/",
    Component: DashBoard,
  },
  {
    path: "lectures",
    Component: Lectures,
  },
  {
    path: "course",
    Component: course,
  },
  {
    path: "activity",
    Component: Activity,
  },
  {
    path: "rooms",
    Component: Room,
  },
  {
    path: "student-group",
    Component: StudentGroup,
  },
  {
    path: "schedules/:semester",
    Component: ScheduleTable,
  },
]);
function App() {
  return (
    <MenuProvider>
      <RouterProvider router={router} />
    </MenuProvider>
  );
}

export default App;
