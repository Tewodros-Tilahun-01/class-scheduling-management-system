import DashBoard from "./pages/DashBoard";
import { MenuProvider } from "./hooks/MenuProvider";

import { createBrowserRouter, RouterProvider } from "react-router";
import Lectures from "./pages/Lectures";
let router = createBrowserRouter([
  {
    path: "/",
    Component: DashBoard,
  },
  {
    path: "lectures",
    Component: Lectures,
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
