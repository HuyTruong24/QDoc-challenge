import React from "react";
import { Outlet } from "react-router-dom";
import { IoReorderThreeSharp } from "react-icons/io5";
import NavigationBar from "./NavigationBar";

export default function AppLayout() {
  const [isNavBarOpen, setIsNavBarOpen] = React.useState(false);

  function toggleSidebar() {
    setIsNavBarOpen((prev) => !prev);
  }

  return (
    <>
      {!isNavBarOpen && (
        <IoReorderThreeSharp
          className="text-4xl cursor-pointer fixed top-4 left-4 z-50"
          onClick={toggleSidebar}
        />
      )}
      {isNavBarOpen && (
        <NavigationBar
          isOpen={isNavBarOpen}
          onClose={() => setIsNavBarOpen(false)}
        />
      )}
      <Outlet />
    </>
  );
}
