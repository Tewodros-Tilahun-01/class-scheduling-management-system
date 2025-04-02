import DashBoard from "./components/pages/DashBoard/DashBoard";
import { MenuProvider } from "./components/hooks/MenuProvider";

function App() {
  return (
    <MenuProvider>
      <DashBoard />
    </MenuProvider>
  );
}

export default App;