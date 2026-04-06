import React, { useRef, useState } from "react";
import { navbarStyles as ns } from "../assets/dummyStyles";
import logoImg from "../assets/logo.png";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  UserPlus,
  Users,
  Calendar,
  Grid,
  PlusSquare,
  List,
} from "lucide-react";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const navInnerRef = useRef(null);
  const indicatorRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <header className={ns.header}>
      <nav className={ns.navContainer}>
        <div className={ns.flexContainer}>
          <div className={ns.logoContainer}>
            <img src={logoImg} alt="logo" classNam={ns.logoImage} />

            <Link to="/">
              <div className={ns.logoLink}>MediCare</div>
              <div className={ns.logoSubtext}>Healthcare Solutions</div>
            </Link>

            {/* Center navigation */}
            <div className={ns.centerNavContainer}>
              <div className={ns.glowEffect}>
                <div className={ns.centerNavInner}>
                  <div
                    ref={navInnerRef}
                    tabIndex={0}
                    className={ns.centerNavScrollContainer}
                    style={{
                      WebkitOverflowScrolling: "touch",
                    }}
                  >
                    <CenterNavItem
                      to="/h"
                      label="Dashboard"
                      icon={<Home size={16} />}
                    />
                    <CenterNavItem
                      to="/add"
                      label="Add Doctor"
                      icon={<UserPlus size={16} />}
                    />
                    <CenterNavItem
                      to="/list"
                      label="List Doctors"
                      icon={<Users size={16} />}
                    />
                    <CenterNavItem
                      to="/appointments"
                      label="Appointments"
                      icon={<Calendar size={16} />}
                    />
                    <CenterNavItem
                      to="/service-dashboard"
                      label="Service Dashboard"
                      icon={<Grid size={16} />}
                    />
                    <CenterNavItem
                      to="/add-service"
                      label="Add Service"
                      icon={<PlusSquare size={16} />}
                    />
                    <CenterNavItem
                      to="/list-service"
                      label="List Services"
                      icon={<List size={16} />}
                    />
                    <CenterNavItem
                      to="/service-appointments"
                      label="Service Appointments"
                      icon={<Calendar size={16} />}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;

function CenterNavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `nav-item ${isActive ? "active" : ""} ${ns.centerNavItemBase} ${
          isActive ? ns.centerNavItemActive : ns.centerNavItemInactive
        }`
      }
    >
      <span>{icon}</span>
      <span className="font-medium">{label}</span>
    </NavLink>
  );
}
