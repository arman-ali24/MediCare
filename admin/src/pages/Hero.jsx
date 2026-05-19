import React from "react";
import Navbar from "../components/Navbar";
import logoImg from "../assets/logo.png";
import {
  ShieldCheck,
  Activity,
  Users,
  Calendar,
  Stethoscope,
  HeartPulse,
} from "lucide-react";

const Hero = ({ role = "admin", userName = "Doctor" }) => {
  const isDoctor = role?.toLowerCase() === "doctor";

  const stats = [
    {
      title: "Appointments",
      value: "2.4K+",
      icon: Calendar,
    },
    {
      title: "Doctors",
      value: "500+",
      icon: Stethoscope,
    },
    {
      title: "Patients",
      value: "10K+",
      icon: Users,
    },
    {
      title: "System Health",
      value: "99.9%",
      icon: HeartPulse,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 overflow-hidden">
      <Navbar />

      <main className="pt-16 px-4 sm:px-6 lg:px-10 pb-12">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-[-120px] w-[350px] h-[350px] bg-emerald-400/20 blur-3xl rounded-full" />
          <div className="absolute bottom-0 right-[-120px] w-[350px] h-[350px] bg-cyan-400/20 blur-3xl rounded-full" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          {/* HERO SECTION */}
          <div
            className="
              relative overflow-hidden
              rounded-[2rem]
              border border-white/60
              bg-white/70 backdrop-blur-2xl
              shadow-[0_10px_60px_rgba(0,0,0,0.08)]
              px-6 sm:px-10 lg:px-16
              py-12 lg:py-16
            "
          >
            {/* Decorative Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-cyan-500/5 to-blue-500/5" />

            <div className="relative z-10 grid lg:grid-cols-2 gap-14 items-center">
              {/* LEFT CONTENT */}
              <div>
                <div
                  className="
                    inline-flex items-center gap-2
                    px-4 py-2 rounded-full
                    bg-emerald-50 border border-emerald-100
                    text-emerald-600 text-sm font-semibold
                    mb-6
                  "
                >
                  <ShieldCheck size={16} />
                  Secure Healthcare Management
                </div>

                <div className="flex items-center gap-4 mb-7">
                  <div
                    className="
                      w-20 h-20 rounded-3xl
                      bg-white shadow-lg
                      flex items-center justify-center
                      border border-slate-100
                    "
                  >
                    <img
                      src={logoImg}
                      alt="logo"
                      className="w-14 object-contain"
                    />
                  </div>

                  <div>
                    <h2 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
                      MediCare
                    </h2>

                    <p className="text-slate-500 font-semibold tracking-[0.25em] uppercase text-xs mt-1">
                      Healthcare Solutions
                    </p>
                  </div>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight text-slate-900">
                  {isDoctor
                    ? `Welcome Back, Dr. ${userName}`
                    : "Modern Hospital Management System"}
                </h1>

                <p className="mt-6 text-base sm:text-lg leading-8 text-slate-600 max-w-2xl">
                  {isDoctor
                    ? "Manage appointments, patient records, and medical services seamlessly with a secure and intelligent healthcare dashboard."
                    : "Control doctors, appointments, healthcare services, patient data, and hospital operations from one modern admin platform."}
                </p>

                {/* ACTION BUTTONS */}
                <div className="flex flex-wrap gap-4 mt-8">
                  <button
                    className="
                      px-7 py-3 rounded-2xl
                      bg-gradient-to-r from-emerald-500 to-cyan-500
                      text-white font-semibold
                      shadow-lg shadow-emerald-500/20
                      hover:scale-[1.03]
                      hover:shadow-xl
                      transition-all duration-300
                    "
                  >
                    Open Dashboard
                  </button>

                  <button
                    className="
                      px-7 py-3 rounded-2xl
                      border border-slate-200
                      bg-white/80 backdrop-blur
                      text-slate-700 font-semibold
                      hover:border-emerald-200
                      hover:text-emerald-600
                      hover:bg-emerald-50
                      transition-all duration-300
                    "
                  >
                    View Reports
                  </button>
                </div>
              </div>

              {/* RIGHT SIDE CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {stats.map(({ title, value, icon: Icon }) => (
                  <div
                    key={title}
                    className="
                      group relative overflow-hidden
                      rounded-3xl
                      border border-white/60
                      bg-white/80 backdrop-blur-xl
                      p-6
                      shadow-lg
                      hover:-translate-y-1
                      hover:shadow-2xl
                      transition-all duration-300
                    "
                  >
                    <div
                      className="
                        absolute top-0 right-0
                        w-28 h-28 rounded-full
                        bg-emerald-500/10 blur-2xl
                      "
                    />

                    <div
                      className="
                        w-14 h-14 rounded-2xl
                        bg-gradient-to-r from-emerald-500 to-cyan-500
                        flex items-center justify-center
                        text-white
                        shadow-lg
                        mb-5
                      "
                    >
                      <Icon size={24} />
                    </div>

                    <h3 className="text-slate-500 text-sm font-semibold">
                      {title}
                    </h3>

                    <h2 className="mt-2 text-3xl font-black text-slate-900">
                      {value}
                    </h2>

                    <div className="mt-4 flex items-center gap-2 text-emerald-600 text-sm font-semibold">
                      <Activity size={16} />
                      Live Monitoring
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BOTTOM INFO SECTION */}
          <div className="grid md:grid-cols-3 gap-6 mt-10">
            <InfoCard
              title="Secure Access"
              text="Protected role-based authentication with encrypted healthcare records and secure admin controls."
            />

            <InfoCard
              title="Real-time Analytics"
              text="Track appointments, doctors, patients, and healthcare activities with live system updates."
            />

            <InfoCard
              title="Smart Management"
              text="Modern interface for managing services, appointments, and hospital workflows efficiently."
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Hero;

function InfoCard({ title, text }) {
  return (
    <div
      className="
        relative overflow-hidden
        rounded-3xl
        border border-white/60
        bg-white/70 backdrop-blur-xl
        p-6
        shadow-lg
        hover:-translate-y-1
        hover:shadow-2xl
        transition-all duration-300
      "
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-2xl rounded-full" />

      <h3 className="text-lg font-bold text-slate-900">{title}</h3>

      <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
    </div>
  );
}