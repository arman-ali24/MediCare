import React, { useEffect, useRef, useState } from "react";
import {
  Star,
  ShieldCheck,
  Quote,
} from "lucide-react";

const Testimonial = () => {
  const scrollRefLeft = useRef(null);
  const scrollRefRight = useRef(null);

  const [isPaused, setIsPaused] = useState(false);

  const testimonials = [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      role: "Cardiologist",
      rating: 5,
      text: "The appointment booking system is incredibly efficient. It saves me valuable time and helps me focus on patient care.",
      image:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
      type: "doctor",
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Patient",
      rating: 5,
      text: "Scheduling appointments has never been easier. The interface is intuitive and reminders are very helpful!",
      image:
        "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=400&q=80",
      type: "patient",
    },
    {
      id: 3,
      name: "Dr. Robert Martinez",
      role: "Pediatrician",
      rating: 4,
      text: "This platform has streamlined our clinic operations significantly. Patient management is much more organized.",
      image:
        "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=400&q=80",
      type: "doctor",
    },
    {
      id: 4,
      name: "Emily Williams",
      role: "Patient",
      rating: 5,
      text: "Booking appointments online 24/7 is a game-changer. The confirmation system gives me peace of mind.",
      image:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
      type: "patient",
    },
    {
      id: 5,
      name: "Dr. Amanda Lee",
      role: "Dermatologist",
      rating: 5,
      text: "Excellent platform for managing appointments. Automated reminders reduce no-shows dramatically.",
      image:
        "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=400&q=80",
      type: "doctor",
    },
    {
      id: 6,
      name: "David Thompson",
      role: "Patient",
      rating: 5,
      text: "The wait time has reduced significantly since using this platform. Very convenient and user-friendly!",
      image:
        "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=400&q=80",
      type: "patient",
    },
  ];

  const leftTestimonials = testimonials.filter(
    (t) => t.type === "doctor"
  );

  const rightTestimonials = testimonials.filter(
    (t) => t.type === "patient"
  );

  useEffect(() => {
    const scrollLeft = scrollRefLeft.current;
    const scrollRight = scrollRefRight.current;

    if (!scrollLeft || !scrollRight) return;

    let scrollSpeed = 0.5;
    let rafId;

    const smoothScroll = () => {
      if (!isPaused) {
        scrollLeft.scrollTop += scrollSpeed;
        scrollRight.scrollTop -= scrollSpeed;

        if (
          scrollLeft.scrollTop >=
          scrollLeft.scrollHeight / 2
        ) {
          scrollLeft.scrollTop = 0;
        }

        if (scrollRight.scrollTop <= 0) {
          scrollRight.scrollTop =
            scrollRight.scrollHeight / 2;
        }
      }

      rafId = requestAnimationFrame(smoothScroll);
    };

    rafId = requestAnimationFrame(smoothScroll);

    return () => cancelAnimationFrame(rafId);
  }, [isPaused]);

  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating
            ? "fill-yellow-400 text-yellow-400"
            : "text-slate-300"
        }`}
      />
    ));

  const TestimonialCard = ({
    testimonial,
    direction,
  }) => (
    <div className="group bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
      {/* Top */}
      <div className="flex items-start gap-4">
        <img
          src={testimonial.image}
          alt={testimonial.name}
          className="w-16 h-16 rounded-2xl object-cover border border-slate-200"
        />

        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-slate-900 font-bold text-lg">
                {testimonial.name}
              </h4>

              <p
                className={`text-sm font-medium ${
                  direction === "left"
                    ? "text-emerald-600"
                    : "text-cyan-600"
                }`}
              >
                {testimonial.role}
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-1">
              {renderStars(testimonial.rating)}
            </div>
          </div>

          {/* Quote */}
          <div className="mt-5 relative">
            <Quote className="absolute -top-2 -left-1 w-8 h-8 text-slate-100" />

            <p className="relative text-slate-600 leading-relaxed text-[15px] pl-4">
              {testimonial.text}
            </p>
          </div>

          {/* Mobile Stars */}
          <div className="flex sm:hidden items-center gap-1 mt-4">
            {renderStars(testimonial.rating)}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <section className="relative overflow-hidden py-20 bg-gradient-to-b from-[#f8fbff] to-[#eef7ff]">
      {/* Background Blur */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-100/40 rounded-full blur-3xl"></div>

      <div className="absolute bottom-0 right-0 w-72 h-72 bg-cyan-100/40 rounded-full blur-3xl"></div>

      <div className="relative max-w-7xl mx-auto px-5 lg:px-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white border border-emerald-100 shadow-sm text-emerald-600 text-sm font-semibold">
            <ShieldCheck size={16} />
            Trusted Testimonials
          </div>

          <h2 className="mt-6 text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Voices of
            <span className="block bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
              Trust & Care
            </span>
          </h2>

          <p className="mt-6 text-slate-600 text-lg leading-relaxed">
            Real experiences shared by doctors and patients
            who trust our healthcare platform every day.
          </p>
        </div>

        {/* Grid */}
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-16"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Doctors */}
          <div className="relative bg-white/70 backdrop-blur-xl border border-slate-200 rounded-[32px] overflow-hidden shadow-sm p-5">
            <div className="sticky top-0 z-10 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl px-5 py-4 font-bold text-lg shadow-lg">
              👩‍⚕️ Medical Professionals
            </div>

            <div
              ref={scrollRefLeft}
              className="h-[560px] overflow-hidden mt-5 space-y-5"
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => setIsPaused(false)}
            >
              <div className="space-y-5">
                {[...leftTestimonials, ...leftTestimonials].map(
                  (t, i) => (
                    <TestimonialCard
                      key={`L-${i}`}
                      testimonial={t}
                      direction="left"
                    />
                  )
                )}
              </div>
            </div>
          </div>

          {/* Patients */}
          <div className="relative bg-white/70 backdrop-blur-xl border border-slate-200 rounded-[32px] overflow-hidden shadow-sm p-5">
            <div className="sticky top-0 z-10 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-2xl px-5 py-4 font-bold text-lg shadow-lg">
              🧑‍💼 Patients
            </div>

            <div
              ref={scrollRefRight}
              className="h-[560px] overflow-hidden mt-5 space-y-5"
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => setIsPaused(false)}
            >
              <div className="space-y-5">
                {[...rightTestimonials, ...rightTestimonials].map(
                  (t, i) => (
                    <TestimonialCard
                      key={`R-${i}`}
                      testimonial={t}
                      direction="right"
                    />
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonial;