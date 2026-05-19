import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  Medal,
  MousePointer2Off,
  ShieldCheck,
} from "lucide-react";

const HomeDoctors = ({ previewCount = 8 }) => {
  const API_BASE = "https://medicare-backend-t2oa.onrender.com";

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`${API_BASE}/api/doctors`);
        const json = await res.json().catch(() => null);

        if (!res.ok) {
          const msg =
            (json && json.message) || `Failed to load doctors (${res.status})`;

          if (!mounted) return;

          setError(msg);
          setDoctors([]);
          setLoading(false);
          return;
        }

        const items = (json && (json.data || json)) || [];

        const normalized = (Array.isArray(items) ? items : []).map((d) => {
          const id = d._id || d.id;

          const image =
            d.imageUrl || d.image || d.imageSmall || d.imageSrc || "";

          const available =
            (typeof d.availability === "string"
              ? d.availability.toLowerCase() === "available"
              : typeof d.available === "boolean"
              ? d.available
              : d.availability === true) ||
            d.availability === "Available";

          return {
            id,
            name: d.name || "Unknown",
            specialization: d.specialization || "",
            image,
            experience:
              d.experience || d.experience === 0
                ? String(d.experience)
                : "",
            fee: d.fee ?? d.price ?? 0,
            available,
            raw: d,
          };
        });

        if (!mounted) return;

        setDoctors(normalized);
      } catch (err) {
        if (!mounted) return;

        console.error("load doctors error:", err);

        setError("Network error while loading doctors.");
        setDoctors([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [API_BASE]);

  const preview = doctors.slice(0, previewCount);

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
            Verified Medical Specialists
          </div>

          <h1 className="mt-6 text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Meet Our
            <span className="block bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
              Expert Doctors
            </span>
          </h1>

          <p className="mt-6 text-slate-600 text-lg leading-relaxed">
            Book appointments instantly with highly experienced and trusted
            healthcare professionals.
          </p>
        </div>

        {/* Error */}
        {error ? (
          <div className="mt-10 bg-red-50 border border-red-100 text-red-600 rounded-3xl p-6 text-center">
            <p className="font-medium">{error}</p>

            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-5 py-2 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-all"
            >
              Retry
            </button>
          </div>
        ) : null}

        {/* Loading */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7 mt-16">
            {Array.from({ length: previewCount }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm animate-pulse"
              >
                <div className="h-72 bg-slate-200"></div>

                <div className="p-5">
                  <div className="h-5 bg-slate-200 rounded w-3/4"></div>

                  <div className="h-4 bg-slate-100 rounded w-1/2 mt-3"></div>

                  <div className="h-10 bg-slate-200 rounded-xl mt-6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Doctors Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7 mt-16">
              {preview.map((doctor) => (
                <article
                  key={doctor.id || doctor.name}
                  className="group bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
                >
                  {/* Image */}
                  <div className="relative overflow-hidden">
                    {doctor.available ? (
                      <Link
                        to={`/doctors/${doctor.id}`}
                        state={{
                          doctor: doctor.raw || doctor,
                        }}
                      >
                        <img
                          src={doctor.image || "/placeholder-doctor.jpg"}
                          alt={doctor.name}
                          loading="lazy"
                          className="w-full h-72 object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src =
                              "/placeholder-doctor.jpg";
                          }}
                        />
                      </Link>
                    ) : (
                      <>
                        <img
                          src={doctor.image || "/placeholder-doctor.jpg"}
                          alt={doctor.name}
                          loading="lazy"
                          className="w-full h-72 object-cover grayscale"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src =
                              "/placeholder-doctor.jpg";
                          }}
                        />

                        <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                          Not Available
                        </div>
                      </>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-900">
                      {doctor.name}
                    </h3>

                    <p className="mt-2 text-slate-500 text-sm">
                      {doctor.specialization}
                    </p>

                    {/* Experience */}
                    <div className="mt-5 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-2xl text-emerald-700 text-sm font-medium">
                      <Medal className="w-4 h-4" />
                      {doctor.experience} Years Experience
                    </div>

                    {/* Button */}
                    <div className="mt-6">
                      {doctor.available ? (
                        <Link
                          to={`/doctors/${doctor.id}`}
                          state={{
                            doctor: doctor.raw || doctor,
                          }}
                          className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold py-3 rounded-2xl shadow-lg hover:shadow-emerald-200 transition-all duration-300"
                        >
                          Book Now
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="w-full inline-flex items-center justify-center gap-2 bg-slate-100 text-slate-500 font-semibold py-3 rounded-2xl cursor-not-allowed"
                        >
                          <MousePointer2Off className="w-5 h-5" />
                          Not Available
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="flex justify-center mt-14">
              <Link
                to="/doctors"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-semibold shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                View All Doctors
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default HomeDoctors;