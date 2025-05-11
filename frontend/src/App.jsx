import DashBoard from "./pages/DashBoard";
import { MenuProvider } from "./hooks/MenuProvider";

import { createBrowserRouter, RouterProvider } from "react-router";
import Lectures from "./pages/Lectures";
import course from "./pages/Course";
import Activity from "./pages/Activity";
import Room from "./pages/Room";
import { StudentGroup } from "./pages/StudentGroup";
import ScheduleTable from "./pages/ScheduleTable";
import ThemeLayout from "./layouts/ThemeLayout";
import TimeslotManager from "./pages/TimeslotManager";
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
  // { path: "TimeslotManager", Component: TimeslotManager },
]);
function App() {
  return (
    <ThemeLayout>
      <MenuProvider>
        <RouterProvider router={router} />
      </MenuProvider>
    </ThemeLayout>
  );
}

export default App;
