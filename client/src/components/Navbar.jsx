import React, { useEffect, useRef, useState } from "react";
import { navbarStyles } from "../assets/dummyStyles";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { SignedIn, SignedOut, useClerk, UserButton } from "@clerk/clerk-react";
import { Key, Menu, User, X } from "lucide-react";
import logo from "../assets/logo.png";

const STORAGE_KEY = "doctorToken_v1";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isDoctorLoggedIn, setIsDoctorLoggedIn] = useState(() => {
    try {
      return Boolean(localStorage.getItem(STORAGE_KEY));
    } catch {
      return false;
    }
  });
  const location = useLocation();
  const navRef = useRef(null);
  const clerk = useClerk();
  const navigate = useNavigate();

  // Hide and Show Navbar on Scroll
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

  // Sync the Doctor login state
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) {
        setIsDoctorLoggedIn(Boolean(e.newValue));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Close the toggle menu for mobile when click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && navRef.current && !navRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

        .nav-logo-title {
          font-family: 'Plus Jakarta Sans', sans-serif !important;
          font-weight: 800 !important;
          letter-spacing: -0.5px !important;
          background: linear-gradient(135deg, #1e40af, #2563eb) !important;
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
          font-size: 9.5px !important;
        }
        .nav-item-link {
          font-family: 'DM Sans', sans-serif !important;
          font-weight: 500 !important;
          letter-spacing: 0.01em !important;
        }
        .nav-item-link-active {
          font-family: 'DM Sans', sans-serif !important;
          font-weight: 700 !important;
          color: #2563eb !important;
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
          background: linear-gradient(135deg, #2563eb, #3b82f6) !important;
        }
      `}</style>

      <div className={navbarStyles.navbarBorder}></div>
      <nav
        ref={navRef}
        className={`${navbarStyles.navbarContainer} ${
          showNavbar ? navbarStyles.navbarVisible : navbarStyles.navbarHidden
        }`}
      >
        <div className={navbarStyles.contentWrapper}>
          <div className={navbarStyles.flexContainer}>
            {/* Logo */}
            <Link to="/" className={navbarStyles.logoLink}>
              <div className={navbarStyles.logoContainer}>
                <div className={navbarStyles.logoImageWrapper}>
                  <img
                    src={logo}
                    alt="logo"
                    className={navbarStyles.logoImage}
                  />
                </div>
              </div>
              <div className={navbarStyles.logoTextContainer}>
                <h1 className={`${navbarStyles.logoTitle} nav-logo-title`}>MediCare</h1>
                <p className={`${navbarStyles.logoSubtitle} nav-logo-sub`}>
                  Healthcare Solutions
                </p>
              </div>
            </Link>

            <div className={navbarStyles.desktopNav}>
              <div className={navbarStyles.navItemsContainer}>
                {navItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={`${navbarStyles.navItem} ${
                        isActive
                          ? `${navbarStyles.navItemActive} nav-item-link-active`
                          : `${navbarStyles.navItemInactive} nav-item-link`
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* right side */}
            <div className={navbarStyles.rightContainer}>
              <SignedOut>
                <Link
                  to="/doctor-admin/login"
                  className={`${navbarStyles.doctorAdminButton} nav-doctor-btn`}
                >
                  <User className={navbarStyles.doctorAdminIcon} />
                  <span className={navbarStyles.doctorAdminText}>
                    Doctor Admin
                  </span>
                </Link>
                {/* patient login */}
                <button
                  onClick={() => clerk.openSignIn()}
                  className={`${navbarStyles.loginButton} nav-login-btn`}
                >
                  <Key className={navbarStyles.loginIcon} />
                  Login
                </button>
              </SignedOut>

              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>

              {/* to toggle */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={navbarStyles.mobileToggle}
              >
                {isOpen ? (
                  <X className={navbarStyles.toggleIcon} />
                ) : (
                  <Menu className={navbarStyles.toggleIcon} />
                )}
              </button>
            </div>
          </div>

          {/* mobile navigations */}
          {isOpen && (
            <div className={navbarStyles.mobileMenu}>
              {navItems.map((item, idx) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={idx}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`${navbarStyles.mobileMenuItem} ${
                      isActive
                        ? `${navbarStyles.mobileMenuItemActive} nav-item-link-active`
                        : `${navbarStyles.mobileMenuItemInactive} nav-item-link`
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <SignedOut>
                <Link
                  to="/doctor-admin/login"
                  className={`${navbarStyles.mobileDoctorAdminButton} nav-doctor-btn`}
                  onClick={() => setIsOpen(false)}
                >
                  Doctor Admin
                </Link>

                <div className={navbarStyles.mobileLoginContainer}>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      clerk.openSignIn();
                    }}
                    className={`${navbarStyles.mobileLoginButton} nav-login-btn`}
                  >
                    Login
                  </button>
                </div>
              </SignedOut>
            </div>
          )}
        </div>

        <style>{navbarStyles.animationStyles}</style>
      </nav>
    </>
  );
};

export default Navbar;
