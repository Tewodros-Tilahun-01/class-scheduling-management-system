import DashBoard from "./pages/DashBoard";
import { MenuProvider } from "./hooks/MenuProvider";

import { createBrowserRouter, RouterProvider } from "react-router";
import Lectures from "./pages/Lectures";
import course from "./pages/Course";
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
]);
function App() {
  return (
    <MenuProvider>
      <RouterProvider router={router} />
    </MenuProvider>
  );
}

export default App;
