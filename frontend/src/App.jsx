import DashBoard from "./pages/DashBoard";
import { MenuProvider } from "./hooks/MenuProvider";

import { createBrowserRouter, RouterProvider } from "react-router";
let router = createBrowserRouter([
  {
    path: "/",
    Component: DashBoard,
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
