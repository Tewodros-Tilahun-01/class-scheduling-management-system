import React from "react";
import Header from "./components/Header";
import SideBar from "./components/SideBar";
import Main from "./components/Main";

function App() {
  return (
    <div className="grid grid-cols-[1fr_6fr] grid-rows-[auto_1fr] h-screen ">
      <SideBar className="row-span-full pt-5 border-r-2 border-gray-300 border-dotted flex flex-col px-6" />
      <Header className="bg-gray-100 px-14 py-8" />
      <Main className="bg-gray-100 px-14 " />
    </div>
  );
}

export default App;
