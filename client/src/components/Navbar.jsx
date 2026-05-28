import React, { useEffect, useRef, useState } from "react";
import { navbarStyles } from "../assets/dummyStyles";
import { useLocation, Link } from "react-router-dom";
import { SignedIn, SignedOut, useClerk, UserButton } from "@clerk/clerk-react";
import { Key, Menu, User, X } from "lucide-react";
import logo from "../assets/logo.png";

const STORAGE_KEY = "doctorToken_v1";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const location = useLocation();
  const navRef = useRef(null);
  const clerk = useClerk();

  // Hide / Show Navbar on Scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Close mobile menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && navRef.current && !navRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Doctors", href: "/doctors" },
    { label: "Services", href: "/services" },
    { label: "Appointments", href: "/appointments" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <>
      <style>{`
  .nav-logo-title {
    font-family: 'Plus Jakarta Sans', sans-serif !important;
    font-weight: 800 !important;
    letter-spacing: -0.5px !important;
    background: linear-gradient(135deg, #059669, #06b6d4) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    background-clip: text !important;
  }

  .nav-logo-sub {
    font-family: 'DM Sans', sans-serif !important;
    font-weight: 600 !important;
    letter-spacing: 0.9px !important;
    color: #64748b !important;
    text-transform: uppercase !important;
    font-size: 9px !important;
  }

  .nav-item-link {
    font-family: 'DM Sans', sans-serif !important;
    font-weight: 500 !important;
    letter-spacing: 0.01em !important;
    position: relative;
    transition: all 0.3s ease;
  }

  .nav-item-link::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 0%;
    height: 2px;
    background: linear-gradient(to right, #10b981, #06b6d4);
    border-radius: 999px;
    transition: width 0.3s ease;
  }

  .nav-item-link:hover {
    color: #059669 !important;
  }

  .nav-item-link:hover::after {
    width: 70%;
  }

  .nav-item-link-active {
    font-family: 'DM Sans', sans-serif !important;
    font-weight: 700 !important;
    color: #059669 !important;
    position: relative;
  }

  .nav-item-link-active::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 70%;
    height: 2px;
    background: linear-gradient(to right, #10b981, #06b6d4);
    border-radius: 999px;
  }

  .nav-doctor-btn {
    font-family: 'DM Sans', sans-serif !important;
    font-weight: 600 !important;
    letter-spacing: 0.02em !important;
  }

  .nav-login-btn {
    font-family: 'DM Sans', sans-serif !important;
    font-weight: 700 !important;
    letter-spacing: 0.04em !important;
    background: linear-gradient(135deg, #10b981, #06b6d4) !important;
  }
`}</style>

      <div className="fixed top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500 z-[60]" />

      <nav
        ref={navRef}
        className={`
          fixed top-0 left-0 w-full z-50
          backdrop-blur-2xl bg-white/80
          border-b border-slate-200/70
          transition-all duration-500
          ${showNavbar
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0"
          }
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between h-[78px]">
            {/* LOGO */}
            <Link
              to="/"
              className="flex items-center gap-3 group shrink-0"
            >
              <img
                src={logo}
                alt="logo"
                className="
                  h-14 sm:h-16 w-auto object-contain
                  transition-transform duration-300
                  group-hover:scale-105
                "
              />

              <div className="leading-tight">
                <h1 className="text-2xl nav-logo-title">
                  MediCare
                </h1>

                <p className="nav-logo-sub">
                  Healthcare Solutions
                </p>
              </div>
            </Link>

            {/* DESKTOP NAV */}
            <div className="hidden lg:flex items-center gap-8">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`text-[15px] ${isActive
                      ? "nav-item-link-active"
                      : "nav-item-link"
                      }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* RIGHT SIDE */}
            <div className="flex items-center gap-3">
              <SignedOut>
                <Link
                  to="/doctor-admin/login"
                  className="
                    hidden sm:inline-flex
                    items-center gap-2
                    px-4 py-2.5
                    rounded-2xl
                    border border-slate-200
                    bg-white
                    text-slate-700
                    shadow-sm
                    hover:bg-emerald-50
                    hover:text-emerald-600
                    hover:border-emerald-300
                    hover:shadow-lg
                    hover:-translate-y-0.5
                    transition-all duration-300
                    nav-doctor-btn
                  "
                >
                  <User size={18} />
                  Doctor Admin
                </Link>

                <button
                  onClick={() => clerk.openSignIn()}
                  className="
                    hidden sm:inline-flex
                    items-center gap-2
                    px-5 py-2.5
                    rounded-2xl
                    text-white
                    shadow-lg
                    hover:shadow-emerald-200
                    hover:-translate-y-0.5
                    transition-all duration-300
                    nav-login-btn
                  "
                >
                  <Key size={18} />
                  Login
                </button>
              </SignedOut>

              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>

              {/* MOBILE TOGGLE */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="
                  lg:hidden
                  inline-flex items-center justify-center
                  w-11 h-11
                  rounded-2xl
                  border border-slate-200
                  bg-white
                  text-slate-700
                  shadow-sm
                  hover:bg-emerald-50
                  hover:text-emerald-600
                  transition-all duration-300
                "
              >
                {isOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          {/* MOBILE MENU */}
          {isOpen && (
            <div className="lg:hidden pb-5 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col gap-2 pt-3 border-t border-slate-200">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`
                        px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300
                        ${isActive
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          : "text-slate-700 hover:bg-slate-100"
                        }
                      `}
                    >
                      {item.label}
                    </Link>
                  );
                })}

                <SignedOut>
                  <Link
                    to="/doctor-admin/login"
                    onClick={() => setIsOpen(false)}
                    className="
                      mt-3
                      px-4 py-3
                      rounded-2xl
                      border border-slate-200
                      text-slate-700
                      font-semibold
                      hover:bg-emerald-50
                      hover:text-emerald-600
                      transition-all duration-300
                    "
                  >
                    Doctor Admin
                  </Link>

                  <button
                    onClick={() => {
                      setIsOpen(false);
                      clerk.openSignIn();
                    }}
                    className="
                      mt-2
                      px-4 py-3
                      rounded-2xl
                      text-white
                      font-bold
                      nav-login-btn
                    "
                  >
                    Login
                  </button>
                </SignedOut>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* NAVBAR SPACER */}
      <div className="h-[78px]" />
    </>
  );
};

export default Navbar;