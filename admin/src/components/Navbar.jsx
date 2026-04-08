import React, { useEffect, useRef, useState } from "react";
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
import { useAuth, useClerk, useUser } from "@clerk/clerk-react";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const navInnerRef = useRef(null);
  const indicatorRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Clerk
  const clerk = useClerk?.();
  const { getToken, isLoaded: authLoaded } = useAuth();
  const { isSignedIn, user, isLoaded: userLoaded } = useUser();

  // Sliding active indicator
  const moveIndicator = useCallback(() => {
    const container = navInnerRef.current;
    const ind = indicatorRef.current;
    if (!container || !ind) return;

    const active = container.querySelector(".nav-item.active");
    if (!active) {
      ind.style.opacity = "0";
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();

    const left = activeRect.left - containerRect.left + container.scrollLeft;
    const width = activeRect.width;

    ind.style.transform = `translateX(${left}px)`;
    ind.style.width = `${width}px`;
    ind.style.opacity = "1";
  }, []);

  // It will be moving in 0.12 seconds
  useLayoutEffect(() => {
    moveIndicator();
    const t = setTimeout(() => {
      moveIndicator();
    }, 120);
    return () => clearTimeout(t);
  }, [location.pathname, moveIndicator]);

  // It will help in scrolling on x-axis
  useEffect(() => {
    const container = navInnerRef.current;
    if (!container) return;

    const onScroll = () => {
      moveIndicator();
    };
    container.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(() => {
      moveIndicator();
    });
    ro.observe(container);
    if (container.parentElement) ro.observe(container.parentElement);

    window.addEventListener("resize", moveIndicator);

    moveIndicator();

    return () => {
      container.removeEventListener("scroll", onScroll);
      ro.disconnect();
      window.removeEventListener("resize", moveIndicator);
    };
  }, [moveIndicator]);

  // It will toggle the mobile menu ie: close when we click on escape key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // When user signed in, fetch a token and save it in localstorage
  useEffect(() => {
    let mounted = true;
    const storeToken = async () => {
      if (!authLoaded || !userLoaded) return;
      if (!isSignedIn) {
        try {
          localStorage.removeItem("clerk_token");
        } catch (e) {
          // Ignore any error
        }
        return;
      }

      try {
        if (getToken) {
          const token = await getToken();
          if (!mounted) return;
          if (token) {
            try {
              localStorage.setItem("clerk_token", token);
            } catch (e) {
              console.warn("Failed to write clerk token in localstorage", e);
            }
          }
        }
      } catch (err) {
        console.warn("Could not retrieve Clerk token", err);
      }
    };
    storeToken();
    return () => {
      mounted = false;
    };
  }, [isSignedIn, authLoaded, userLoaded, getToken]);

  // To open clerk login box
  const handleOpenSignIn = () => {
    if (!clerk || !clerk.openSignIn) {
      console.warn("Clerk is not available");
      return;
    }
    clerk.openSignIn();
    navigate("/h");
  };

  // To signout
  const handleSignOut = async () => {
    if (!clerk || !clerk.signOut) {
      console.warn("Clerk is not available");
      return;
    }
    try {
      await clerk.signOut();
    } catch (err) {
      console.error("Sign out failed", err);
    } finally {
      try {
        localStorage.removeItem("clerk_token");
      } catch (error) {
        // Ignore
      }
      navigate("/");
    }
  };

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

            {/* Right side */}
            <div className={ns.rightContainer}>
              {/* auth */}
              {isSignedIn ? (
                <button
                  onClick={handleSignOut}
                  className={ns.signOutButton + " " + ns.cursorPointer}
                >
                  Sign Out
                </button>
              ) : (
                <div className="hidden lg:flex items-center gap-2">
                  <button
                    onClick={handleOpenSignIn}
                    className={ns.loginButton + " " + ns.cursorPointer}
                  >
                    Login
                  </button>
                </div>
              )}
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
