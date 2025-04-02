import SideBar from "./SideBar";
import Main from "./Main";

function DashBoard() {
  return (
    <div className="grid grid-cols-[auto_1fr] grid-rows-[auto_1fr] h-screen ">
      <SideBar className="row-span-full pt-5 border-r-2 border-gray-300 border-dotted flex flex-col transition-all duration-1000" />
      
      <Main className="bg-gray-100 px-14 " />
    </div>
  );
}

export default DashBoard;
