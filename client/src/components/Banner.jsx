import React from "react";
import {
  Calendar,
  Clock3,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Users,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import banner from "../assets/DocBanner.png";

const Banner = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-[#071018] text-white min-h-screen flex items-center px-6 lg:px-20 py-16">
      {/* Background Glow */}
      <div className="absolute top-[-120px] left-[-120px] w-[320px] h-[320px] bg-emerald-500/20 blur-3xl rounded-full" />
      <div className="absolute bottom-[-120px] right-[-120px] w-[320px] h-[320px] bg-cyan-500/20 blur-3xl rounded-full" />

      <div className="relative z-10 grid lg:grid-cols-2 gap-14 items-center w-full max-w-7xl mx-auto">
        {/* Left Content */}
        <div>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 backdrop-blur-xl px-4 py-2 rounded-full text-sm font-medium text-emerald-300 mb-6 shadow-lg">
            <Sparkles size={16} />
            Trusted by 10,000+ Patients
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight tracking-tight">
            Smart Healthcare
            <span className="block bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              For Modern Hospitals
            </span>
          </h1>

          {/* Description */}
          <p className="mt-6 text-lg text-slate-300 leading-relaxed max-w-2xl">
            MediCare+ helps hospitals streamline appointments, patient records,
            billing, and doctor management with a secure, scalable, and
            production-ready healthcare platform.
          </p>

          {/* Ratings */}
          <div className="flex items-center gap-4 mt-8">
            <div className="flex items-center gap-1 text-yellow-400">
              {[1, 2, 3, 4, 5].map((item) => (
                <Star key={item} size={18} fill="currentColor" />
              ))}
            </div>
            <p className="text-slate-300 text-sm">
              Rated 4.9/5 by healthcare professionals
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
            <FeatureCard
              icon={<Stethoscope size={20} />}
              title="Expert Specialists"
            />
            <FeatureCard
              icon={<Clock3 size={20} />}
              title="24/7 Healthcare"
            />
            <FeatureCard
              icon={<ShieldCheck size={20} />}
              title="Secure Records"
            />
            <FeatureCard
              icon={<Users size={20} />}
              title="500+ Doctors"
            />
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-10">
            <button
              onClick={() => navigate("/doctors")}
              className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-cyan-500 hover:scale-[1.02] transition-all duration-300 text-white px-8 py-4 rounded-2xl font-semibold shadow-2xl"
            >
              <span className="relative flex items-center justify-center gap-2 z-10">
                <Calendar size={20} />
                Book Appointment
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </span>
            </button>

            <button
              onClick={() => (window.location.href = "tel:9341973592")}
              className="border border-white/20 bg-white/5 hover:bg-white/10 backdrop-blur-xl transition-all duration-300 px-8 py-4 rounded-2xl font-semibold flex items-center justify-center gap-2"
            >
              <Phone size={18} />
              Emergency Call
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-14 border-t border-white/10 pt-8">
            <StatCard value="10K+" label="Patients" />
            <StatCard value="500+" label="Doctors" />
            <StatCard value="24/7" label="Support" />
          </div>
        </div>

        {/* Right Section */}
        <div className="relative flex justify-center lg:justify-end items-center mt-14 lg:mt-0">

          {/* Glow Effect */}
          <div className="absolute w-[420px] h-[420px] bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 blur-3xl rounded-full z-0"></div>

          {/* Top Floating Card */}
          <div className="absolute top-6 -left-4 lg:-left-10 z-20 bg-white/10 border border-white/10 backdrop-blur-xl rounded-2xl px-4 py-3 shadow-2xl hidden md:flex items-center gap-3">

            <div className="bg-emerald-500/20 p-3 rounded-xl text-emerald-400">
              <ShieldCheck size={22} />
            </div>

            <div>
              <p className="font-semibold text-white">Secure System</p>
              <p className="text-sm text-slate-300">HIPAA Friendly</p>
            </div>
          </div>

          {/* Bottom Floating Card */}
          <div className="absolute bottom-6 -right-4 lg:-right-10 z-20 bg-white/10 border border-white/10 backdrop-blur-xl rounded-2xl px-4 py-3 shadow-2xl hidden md:flex items-center gap-3">

            <div className="bg-cyan-500/20 p-3 rounded-xl text-cyan-400">
              <Users size={22} />
            </div>

            <div>
              <p className="font-semibold text-white">Real-time Access</p>
              <p className="text-sm text-slate-300">Fast & Reliable</p>
            </div>
          </div>

          {/* Main Image Card */}
          <div className="relative z-10 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur-2xl rounded-[32px] p-4 lg:p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">

            {/* Inner Gradient */}
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-tr from-emerald-500/10 via-transparent to-cyan-500/10 pointer-events-none"></div>

            {/* Image */}
            <img
              src={banner}
              alt="Healthcare Banner"
              className="relative z-10 w-full max-w-[520px] object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.35)]"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({ icon, title }) => {
  return (
    <div className="group flex items-center gap-3 bg-white/5 border border-white/10 hover:border-emerald-400/40 hover:bg-white/10 transition-all duration-300 rounded-2xl px-5 py-4 backdrop-blur-xl shadow-lg">
      <div className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-emerald-400 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <span className="font-medium text-slate-200">{title}</span>
    </div>
  );
};

const StatCard = ({ value, label }) => {
  return (
    <div>
      <h3 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
        {value}
      </h3>
      <p className="text-slate-400 mt-1">{label}</p>
    </div>
  );
};

export default Banner;
