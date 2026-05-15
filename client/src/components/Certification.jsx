import React from "react";

import {
  ShieldCheck,
  BadgeCheck,
} from "lucide-react";

import C3 from "../assets/C3.png";
import C1 from "../assets/C1.png";
import C2 from "../assets/C2.png";
import C4 from "../assets/C4.svg";
import C5 from "../assets/C5.png";
import C6 from "../assets/C6.png";
import C7 from "../assets/C7.svg";

const Certification = () => {
  const certifications = [
    {
      id: 1,
      name: "Medical Commission",
      image: C1,
    },
    {
      id: 2,
      name: "Government Approved",
      image: C2,
    },
    {
      id: 3,
      name: "NABH Accredited",
      image: C3,
    },
    {
      id: 4,
      name: "Medical Council",
      image: C4,
    },
    {
      id: 5,
      name: "Quality Healthcare",
      image: C5,
    },
    {
      id: 6,
      name: "Paramedical Council",
      image: C6,
    },
    {
      id: 7,
      name: "Ministry of Health",
      image: C7,
    },
  ];

  const duplicatedCertifications = [
    ...certifications,
    ...certifications,
  ];

  return (
    <section className="relative overflow-hidden py-20 bg-gradient-to-b from-[#f8fbff] to-[#eef7ff]">

      {/* Soft Background */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-100 rounded-full blur-3xl opacity-40"></div>

      <div className="absolute bottom-0 right-0 w-72 h-72 bg-cyan-100 rounded-full blur-3xl opacity-40"></div>

      <div className="relative max-w-7xl mx-auto px-5 lg:px-10">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white border border-emerald-100 shadow-sm text-emerald-600 text-sm font-semibold">
            <ShieldCheck size={16} />
            Certified Healthcare Standards
          </div>

          {/* Heading */}
          <h2 className="mt-6 text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">

            Trusted &
            <span className="block bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
              Government Approved
            </span>
          </h2>

          {/* Description */}
          <p className="mt-6 text-slate-600 text-lg leading-relaxed">
            Maintaining internationally recognized healthcare
            standards with verified certifications, medical
            accreditations, and quality compliance.
          </p>

          {/* Small Tags */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">

            <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-sm text-slate-700">
              <ShieldCheck
                size={18}
                className="text-emerald-500"
              />
              100% Verified
            </div>

            <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-sm text-slate-700">
              <BadgeCheck
                size={18}
                className="text-cyan-500"
              />
              Healthcare Certified
            </div>
          </div>
        </div>

        {/* Logos */}
        <div className="relative mt-16 overflow-hidden">

          {/* Left Gradient */}
          <div className="absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-[#f8fbff] to-transparent z-10"></div>

          {/* Right Gradient */}
          <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-[#eef7ff] to-transparent z-10"></div>

          {/* Slider */}
          <div className="flex gap-6 animate-marquee w-max">

            {duplicatedCertifications.map((cert, index) => (
              <div
                key={`${cert.id}-${index}`}
                className="group min-w-[230px] bg-white border border-slate-200 rounded-3xl px-6 py-7 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500"
              >

                {/* Logo */}
                <div className="h-24 flex items-center justify-center">
                  <img
                    src={cert.image}
                    alt={cert.name}
                    className="max-h-20 object-contain grayscale group-hover:grayscale-0 transition-all duration-500"
                  />
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-slate-100 my-5"></div>

                {/* Name */}
                <h3 className="text-center text-slate-700 font-semibold text-sm tracking-wide">
                  {cert.name}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Animation */}
      <style>
        {`
          @keyframes marquee {
            0% {
              transform: translateX(0%);
            }

            100% {
              transform: translateX(-50%);
            }
          }

          .animate-marquee {
            animation: marquee 28s linear infinite;
          }

          .animate-marquee:hover {
            animation-play-state: paused;
          }
        `}
      </style>
    </section>
  );
};

export default Certification;