import React, { useMemo, useState } from "react";
import logo from "../assets/logo.png";
import { NavLink, useLocation, useParams } from "react-router-dom";
import {
  Home,
  Calendar,
  Edit,
  LogOut,
  X,
  Menu,
} from "lucide-react";

const DoctorNavbar = () => {
  const [open, setOpen] = useState(false);
  const params = useParams();
  const location = useLocation();

  const doctorId = useMemo(() => {
    if (params?.id) return params.id;

    const m = location.pathname.match(/\/doctor-admin\/([^/]+)/);

    if (m) return m[1];

    return null;
  }, [params, location.pathname]);

  const basePath = doctorId
    ? `/doctor-admin/${doctorId}`
    : "/doctor-admin/login";

  const navItems = [
    { name: "Dashboard", to: `${basePath}`, Icon: Home },
    {
      name: "Appointments",
      to: `${basePath}/appointments`,
      Icon: Calendar,
    },
    {
      name: "Edit Profile",
      to: `${basePath}/profile/edit`,
      Icon: Edit,
    },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between h-20">
            {/* LEFT */}
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="logo"
                className="w-14 sm:w-16 object-contain"
              />

              <div>
                <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                  MediCare
                </h1>

                <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500 font-semibold">
                  Doctor Panel
                </p>
              </div>
            </div>

            {/* DESKTOP MENU */}
            <div className="hidden md:flex items-center gap-2">
              {navItems.map(({ name, to, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === basePath}
                  className={({ isActive }) =>
                    `
                    group relative inline-flex items-center gap-2
                    px-5 py-2.5 rounded-2xl
                    font-semibold text-sm
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
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  localStorage.removeItem("doctorToken_v1");
                  window.location.href = "/doctor-admin/login";
                }}
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

              {/* MOBILE TOGGLE */}
              <button
                onClick={() => setOpen((s) => !s)}
                className="
                  md:hidden
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
          <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl">
            <div className="px-4 py-5 space-y-3">
              {navItems.map(({ name, to, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === basePath}
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

              <button
                onClick={() => {
                  localStorage.removeItem("doctorToken_v1");
                  window.location.href = "/doctor-admin/login";
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
            </div>
          </div>
        )}
      </nav>

      <div className="h-20" />
    </>
  );
};

export default DoctorNavbar;