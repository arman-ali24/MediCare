import React, { useEffect, useMemo, useState } from "react";
import logoImg from "../assets/logo.png";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  UserPlus,
  Users,
  Calendar,
  Grid,
  PlusSquare,
  List,
  Menu,
  X,
  LogOut,
} from "lucide-react";

import { useAuth, useClerk, useUser } from "@clerk/clerk-react";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  const navigate = useNavigate();

  // Clerk
  const clerk = useClerk?.();
  const { getToken, isLoaded: authLoaded } = useAuth();
  const { isSignedIn, isLoaded: userLoaded } = useUser();

  // NAV ITEMS
  const navItems = useMemo(
    () => [
      {
        name: "Dashboard",
        to: "/h",
        Icon: Home,
      },
      {
        name: "Add Doctor",
        to: "/add",
        Icon: UserPlus,
      },
      {
        name: "Doctors",
        to: "/list",
        Icon: Users,
      },
      {
        name: "Appointments",
        to: "/appointments",
        Icon: Calendar,
      },
      {
        name: "Services",
        to: "/service-dashboard",
        Icon: Grid,
      },
      {
        name: "Add Service",
        to: "/add-service",
        Icon: PlusSquare,
      },
      {
        name: "Service List",
        to: "/list-service",
        Icon: List,
      },
      {
        name: "Service Appointments",
        to: "/service-appointments",
        Icon: Calendar,
      },
    ],
    []
  );

  // ESC CLOSE
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // STORE TOKEN
  useEffect(() => {
    let mounted = true;

    const storeToken = async () => {
      if (!authLoaded || !userLoaded) return;

      if (!isSignedIn) {
        localStorage.removeItem("clerk_token");
        return;
      }

      try {
        if (getToken) {
          const token = await getToken();

          if (!mounted) return;

          if (token) {
            localStorage.setItem("clerk_token", token);
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

  // LOGIN
  const handleOpenSignIn = () => {
    if (!clerk || !clerk.openSignIn) {
      console.warn("Clerk is not available");
      return;
    }

    clerk.openSignIn();
    navigate("/h");
  };

  // LOGOUT
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
      localStorage.removeItem("clerk_token");
      navigate("/");
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between h-20 gap-6">
            {/* LEFT */}
            <div className="flex items-center gap-3 shrink-0">
              <img
                src={logoImg}
                alt="logo"
                className="w-14 sm:w-16 object-contain"
              />

              <Link to="/" className="leading-tight">
                <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                  MediCare
                </h1>

                <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500 font-semibold">
                  Admin Panel
                </p>
              </Link>
            </div>

            {/* DESKTOP NAV */}
            <div className="hidden lg:flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {navItems.map(({ name, to, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/h"}
                  className={({ isActive }) =>
                    `
                    group relative inline-flex items-center gap-2
                    px-4 py-2.5 rounded-2xl
                    font-semibold text-sm whitespace-nowrap
                    transition-all duration-300
                    ${isActive
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm"
                      : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 hover:border hover:border-emerald-200"
                    }
                  `
                  }
                >
                  <Icon
                    size={17}
                    className="transition-transform duration-300 group-hover:scale-110"
                  />

                  {name}
                </NavLink>
              ))}
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-3 shrink-0">
              {isSignedIn ? (
                <button
                  onClick={handleSignOut}
                  className="
                    hidden md:inline-flex items-center gap-2
                    px-4 py-2.5 rounded-2xl
                    bg-white border border-slate-200
                    shadow-sm text-slate-700 font-semibold
                    hover:text-red-500
                    hover:border-red-200
                    hover:bg-red-50
                    hover:shadow-lg
                    hover:-translate-y-0.5
                    transition-all duration-300
                  "
                >
                  <LogOut size={16} />
                  Logout
                </button>
              ) : (
                <button
                  onClick={handleOpenSignIn}
                  className="
                    hidden md:inline-flex items-center gap-2
                    px-5 py-2.5 rounded-2xl
                    bg-gradient-to-r from-emerald-500 to-cyan-500
                    text-white font-semibold
                    shadow-lg shadow-emerald-200
                    hover:scale-[1.03]
                    transition-all duration-300
                  "
                >
                  Login
                </button>
              )}

              {/* MOBILE BUTTON */}
              <button
                onClick={() => setOpen((s) => !s)}
                className="
                  lg:hidden
                  inline-flex items-center justify-center
                  w-11 h-11 rounded-2xl
                  border border-slate-200 bg-white
                  shadow-sm text-slate-700
                  hover:bg-emerald-50
                  hover:text-emerald-600
                  hover:border-emerald-200
                  transition-all duration-300
                "
              >
                {open ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE MENU */}
        {open && (
          <div className="lg:hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl">
            <div className="px-4 py-5 space-y-3 max-h-[85vh] overflow-y-auto">
              {navItems.map(({ name, to, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/h"}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `
                    flex items-center gap-3
                    px-4 py-3 rounded-2xl
                    font-semibold transition-all duration-300
                    ${isActive
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-600"
                    }
                  `
                  }
                >
                  <Icon size={18} />
                  {name}
                </NavLink>
              ))}

              {isSignedIn ? (
                <button
                  onClick={() => {
                    handleSignOut();
                    setOpen(false);
                  }}
                  className="
                    w-full flex items-center justify-center gap-2
                    px-4 py-3 rounded-2xl
                    bg-red-50 text-red-500 font-semibold
                    border border-red-100
                    hover:bg-red-100
                    transition-all duration-300
                  "
                >
                  <LogOut size={17} />
                  Logout
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleOpenSignIn();
                    setOpen(false);
                  }}
                  className="
                    w-full flex items-center justify-center gap-2
                    px-4 py-3 rounded-2xl
                    bg-gradient-to-r from-emerald-500 to-cyan-500
                    text-white font-semibold
                    transition-all duration-300
                  "
                >
                  Login
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* NAVBAR SPACER */}
      <div className="h-20" />
    </>
  );
};

export default Navbar;
