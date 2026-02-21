import { Sidebar, Menu, MenuItem } from 'react-pro-sidebar';
import { Link } from 'react-router-dom';
import { CgProfile } from "react-icons/cg";
import { FaHistory } from "react-icons/fa";
import { CgHome } from 'react-icons/cg';
import { FaTimes } from "react-icons/fa";
import { TbVaccineBottle } from "react-icons/tb";


const SIDEBAR_WIDTH = 260;

function SideNav ({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <Sidebar
      width={`${SIDEBAR_WIDTH}px`}
      rootStyles={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        zIndex: 40,
        borderRight: "1px solid #e5e7eb",
      }}
    >
      <div className="flex justify-end p-4">
        <button
          onClick={onClose}
          className="text-gray-600 hover:text-red-500 text-lg"
          aria-label="Close navigation"
        >
          <FaTimes />
        </button>
      </div>

      <Menu>
        <MenuItem icon={<CgHome />} component={<Link to="/dashboard" />}>
          Dashboard
        </MenuItem>
        <MenuItem icon={<FaHistory />} component={<Link to="/vaccination-history" />}>
          Vax History
        </MenuItem>
         <MenuItem icon={<TbVaccineBottle />} component={<Link to="/vaccination-eligibility" />}>
          Vax Eligibility
        </MenuItem>
        <MenuItem icon={<CgProfile />} component={<Link to="/profile" />}>
          Profile
        </MenuItem>
      </Menu>
    </Sidebar>
  );
};

export default SideNav;
