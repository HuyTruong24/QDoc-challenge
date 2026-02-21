import { Sidebar, Menu, MenuItem } from 'react-pro-sidebar';
import { Link } from 'react-router-dom';
import { CgProfile } from "react-icons/cg";
import { FaHistory } from "react-icons/fa";
import { CgHome } from 'react-icons/cg';
import { FaTimes } from "react-icons/fa";
function SideNav ({ isOpen, onClose }) {
     if (!isOpen) return null;
  return (
     <>
      {/* ===== Overlay ===== */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* ===== Sidebar ===== */}
      <Sidebar
        rootStyles={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          zIndex: 50,
          transition: "transform 0.3s ease-in-out",
        }}
      >
        {/* Close Button */}
        <div className="flex justify-end p-4">
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-red-500 text-lg"
          >
            <FaTimes />
          </button>
        </div>

        <Menu>
          <MenuItem icon={<CgHome />} component={<Link to="/" />}>
            Dashboard
          </MenuItem>
          <MenuItem icon={<FaHistory />} component={<Link to="/vaccination-history" />}>
            Vax History
          </MenuItem>
          <MenuItem icon={<CgProfile />} component={<Link to="/profile" />}>
            Profile
          </MenuItem>
        </Menu>
      </Sidebar>
    </>
  );
};

export default SideNav;