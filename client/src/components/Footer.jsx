import React from "react";
import { footerStyles } from "../assets/dummyStyles";
import logo from "../assets/logo.png";

import {
  Facebook,
  Instagram,
  Linkedin,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
} from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: "Home", href: "/" },
    { name: "Doctors", href: "/doctors" },
    { name: "Services", href: "/services" },
    { name: "Appointments", href: "/appointments" },
    { name: "Contact", href: "/contact" },
  ];

  const socialLinks = [
    {
      Icon: Facebook,
      name: "Facebook",
      href: "https://www.linkedin.com/in/arman24",
    },
    {
      Icon: Instagram,
      name: "Instagram",
      href: "https://www.linkedin.com/in/arman24",
    },
    {
      Icon: Linkedin,
      name: "LinkedIn",
      href: "https://www.linkedin.com/in/arman24",
    },
  ];

  return (
    <footer className="relative overflow-hidden bg-gradient-to-b from-[#0f172a] to-[#111827] text-white">
      {/* Background Blur */}
      <div className="absolute top-0 left-0 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl"></div>

      <div className="absolute bottom-0 right-0 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl"></div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Company */}
          <div>
            <div className={footerStyles.logoContainer}>
              <div className={footerStyles.logoWrapper}>
                <div className={footerStyles.logoImageContainer}>
                  <img
                    src={logo}
                    alt="logo"
                    className={footerStyles.logoImage}
                  />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white">
                  MediCare
                </h2>

                <p className="text-slate-400 text-sm">
                  Healthcare Solutions
                </p>
              </div>
            </div>

            <p className="mt-4 text-slate-400 leading-relaxed text-sm">
              Trusted doctors, modern healthcare solutions, and seamless appointment
              booking designed to deliver secure, fast, and convenient care for
              every patient.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-5 text-white">
              Quick Links
            </h3>

            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="group flex items-center gap-2 text-slate-400 hover:text-white transition-all duration-300"
                  >
                    <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform duration-300" />

                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h3 className="text-lg font-semibold mb-5 text-white">
              Contact
            </h3>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-slate-300">
                <Phone className="w-4 h-4 text-emerald-400" />

                <span className="text-sm">
                  +91 9341973592
                </span>
              </div>

              <div className="flex items-center gap-3 text-slate-300">
                <Mail className="w-4 h-4 text-cyan-400" />

                <span className="text-sm">
                  armanali0178614@gmail.com
                </span>
              </div>

              <div className="flex items-center gap-3 text-slate-300">
                <MapPin className="w-4 h-4 text-emerald-400" />

                <span className="text-sm">
                  Bhopal, India
                </span>
              </div>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-4 mt-6">
              {socialLinks.map(({ Icon, name, href }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center hover:bg-emerald-500 transition-all duration-300"
                >
                  <Icon className="w-5 h-5 text-slate-300 group-hover:text-white" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-5 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-slate-500">
          <div>
            &copy; {currentYear} MediCare Healthcare. All rights reserved.
          </div>

          <div className="flex items-center gap-2">
            <span>Designed by</span>

            <a
              href="https://iarman.netlify.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 transition-colors duration-300"
            >
              Er Arman
            </a>
          </div>
        </div>
      </div>

      <style>{footerStyles.animationStyles}</style>
    </footer>
  );
};

export default Footer;