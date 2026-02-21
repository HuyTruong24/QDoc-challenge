import React from "react";
import { Outlet } from "react-router-dom";
import { IoReorderThreeSharp } from "react-icons/io5";
import NavigationBar from "./NavigationBar";

const SIDEBAR_WIDTH = 260;

export default function AppLayout() {
  const [isNavBarOpen, setIsNavBarOpen] = React.useState(false);

  function toggleSidebar() {
    setIsNavBarOpen((prev) => !prev);
  }

  return (
    <div className="min-h-screen">
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
      <div
        style={{
          marginLeft: isNavBarOpen ? `${SIDEBAR_WIDTH}px` : "0px",
          transition: "margin-left 0.3s ease-in-out",
          minHeight: "100vh",
        }}
      >
        <Outlet />
      </div>
    </div>
  );
}
