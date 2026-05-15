import React from "react";
import { footerStyles } from "../assets/dummyStyles";
import logo from "../assets/logo.png";

import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Stethoscope,
  Activity,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Send,
} from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: "Home", href: "/" },
    { name: "Doctors", href: "/doctors" },
    { name: "Services", href: "/services" },
    { name: "Contact", href: "/contact" },
    { name: "Appointments", href: "/appointments" },
  ];

  const services = [
    { name: "Blood Pressure Check", href: "/services" },
    { name: "Blood Sugar Test", href: "/services" },
    { name: "Full Blood Count", href: "/services" },
    { name: "X-Ray Scan", href: "/services" },
    { name: "Blood Sugar Test", href: "/services" },
  ];

  const socialLinks = [
    {
      Icon: Facebook,
      name: "Facebook",
      href: "https://www.linkedin.com/in/arman24",
    },
    {
      Icon: Twitter,
      name: "Twitter",
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
    {
      Icon: Youtube,
      name: "YouTube",
      href: "https://www.linkedin.com/in/arman24",
    },
  ];

  return (
    <footer className="relative overflow-hidden bg-gradient-to-b from-[#0f172a] to-[#111827] text-white">
      {/* Background Blur */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl"></div>

      <div className="absolute bottom-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl"></div>

      {/* Floating Icons */}
      <div className={footerStyles.floatingIcon1}>
        <Stethoscope className={footerStyles.stethoscopeIcon} />
      </div>

      <div
        className={footerStyles.floatingIcon2}
        style={{
          animationDelay: "3s",
        }}
      >
        <Activity className={footerStyles.activityIcon} />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Company Section */}
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

            <p className="mt-6 text-slate-400 leading-relaxed text-sm">
              Your trusted healthcare partner delivering modern medical
              services with compassion, innovation, and patient-first care.
            </p>

            {/* Contact */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 text-slate-300">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  <Phone className="w-4 h-4 text-emerald-400" />
                </div>

                <span className="text-sm">
                  +91 9341973592
                </span>
              </div>

              <div className="flex items-center gap-3 text-slate-300">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  <Mail className="w-4 h-4 text-cyan-400" />
                </div>

                <span className="text-sm">
                  armanali0178614@gmail.com
                </span>
              </div>

              <div className="flex items-center gap-3 text-slate-300">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                </div>

                <span className="text-sm">
                  Bhopal, India
                </span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">
              Quick Links
            </h3>

            <ul className="space-y-4">
              {quickLinks.map((link, index) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="group flex items-center gap-2 text-slate-400 hover:text-white transition-all duration-300"
                    style={{
                      animationDelay: `${index * 60}ms`,
                    }}
                  >
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300 text-emerald-400" />

                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">
              Our Services
            </h3>

            <ul className="space-y-4">
              {services.map((service) => (
                <li key={service.name}>
                  <a
                    href={service.href}
                    className="flex items-center gap-3 text-slate-400 hover:text-white transition-all duration-300"
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>

                    {service.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">
              Stay Connected
            </h3>

            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Subscribe for health updates, wellness tips, and medical
              insights directly in your inbox.
            </p>

            {/* Newsletter Input */}
            <div className="relative flex items-center p-1.5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg shadow-black/10 overflow-hidden">

              {/* Soft Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 rounded-2xl"></div>

              {/* Input */}
              <input
                type="email"
                placeholder="Enter your email"
                className="relative flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none"
              />

              {/* Button */}
              <button className="relative group flex items-center justify-center min-w-[48px] h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 shadow-md hover:shadow-emerald-500/30 hover:scale-105">

                <Send className="w-4 h-4 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />

              </button>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-4 mt-8">
              {socialLinks.map(({ Icon, name, href }, index) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group w-11 h-11 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center hover:bg-emerald-500 transition-all duration-300 hover:-translate-y-1"
                  style={{
                    animationDelay: `${index * 120}ms`,
                  }}
                >
                  <Icon className="w-5 h-5 text-slate-300 group-hover:text-white" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-14 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
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