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
    <div style={styles.appShell}>
      {!isNavBarOpen && (
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Open navigation"
          title="Open navigation"
          style={styles.menuButton}
        >
          <IoReorderThreeSharp style={styles.menuIcon} />
        </button>
      )}

      {isNavBarOpen && (
        <NavigationBar
          isOpen={isNavBarOpen}
          onClose={() => setIsNavBarOpen(false)}
          sidebarWidth={SIDEBAR_WIDTH}
        />
      )}

      <div
        style={{
          marginLeft: isNavBarOpen ? `${SIDEBAR_WIDTH}px` : "0px",
          transition: "margin-left 0.25s ease",
          minHeight: "100vh",
          background: "#f6f7fb",
        }}
      >
        <Outlet />
      </div>
    </div>
  );
}

const styles = {
  appShell: {
    minHeight: "100vh",
    background: "#f6f7fb",
    position: "relative",
  },

  menuButton: {
    position: "fixed",
    top: 14,
    left: 14,
    zIndex: 50,
    width: 46,
    height: 46,
    borderRadius: 14,
    border: "1px solid rgba(15,23,42,0.10)",
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(8px)",
    boxShadow: "0 10px 24px rgba(2,6,23,0.10)",
    cursor: "pointer",
    placeItems: "center",
    color: "#0f172a",
  },

  menuIcon: {
    fontSize: 26,
  },
};