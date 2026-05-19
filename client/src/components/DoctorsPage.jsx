import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  CircleChevronDown,
  CircleChevronUp,
  Medal,
  MousePointer2Off,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

import { Link } from "react-router-dom";

const DoctorsPage = () => {
  const API_BASE = "https://medicare-backend-t2oa.onrender.com";

  const [allDoctors, setAllDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false);

  // Load doctors
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
            (json && json.message) ||
            `Failed to load doctors (${res.status})`;

          if (mounted) {
            setError(msg);
            setAllDoctors([]);
            setLoading(false);
          }

          return;
        }

        const items =
          (json && (json.data || json)) || [];

        const normalized = (
          Array.isArray(items) ? items : []
        ).map((d) => {
          const id = d._id || d.id;

          const image =
            d.imageUrl ||
            d.image ||
            d.imageSmall ||
            d.imageSrc ||
            "";

          let available = true;

          if (
            typeof d.availability === "string"
          ) {
            available =
              d.availability.toLowerCase() ===
              "available";
          } else if (
            typeof d.available === "boolean"
          ) {
            available = d.available;
          } else if (
            typeof d.availability === "boolean"
          ) {
            available = d.availability;
          } else {
            available =
              d.availability === "Available" ||
              d.available === true;
          }

          return {
            id,
            name: d.name || "Unknown",
            specialization:
              d.specialization || "",
            image,
            experience:
              d.experience ||
                d.experience === 0
                ? String(d.experience)
                : "—",
            fee: d.fee ?? d.price ?? 0,
            available,
            raw: d,
          };
        });

        if (mounted) {
          setAllDoctors(normalized);
          setError("");
        }
      } catch (err) {
        console.error(err);

        if (mounted) {
          setError(
            "Network error while loading doctors."
          );

          setAllDoctors([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [API_BASE]);

  // Search filter
  const filteredDoctors = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    if (!q) return allDoctors;

    return allDoctors.filter(
      (doctor) =>
        doctor.name
          ?.toLowerCase()
          .includes(q) ||
        doctor.specialization
          ?.toLowerCase()
          .includes(q)
    );
  }, [allDoctors, searchTerm]);

  // Show only 8 initially
  const displayedDoctors = showAll
    ? filteredDoctors
    : filteredDoctors.slice(0, 8);

  // Retry function
  const retry = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${API_BASE}/api/doctors`
      );

      const json = await res
        .json()
        .catch(() => null);

      if (!res.ok) {
        setError(
          (json && json.message) ||
          `Failed to load (${res.status})`
        );

        setAllDoctors([]);

        return;
      }

      const items =
        (json && (json.data || json)) || [];

      const normalized = (
        Array.isArray(items) ? items : []
      ).map((d) => {
        const id = d._id || d.id;

        return {
          id,
          name: d.name || "Unknown",
          specialization:
            d.specialization || "",
          image:
            d.imageUrl || d.image || "",
          experience:
            d.experience ?? "—",
          fee: d.fee ?? d.price ?? 0,
          available:
            d.availability ===
            "Available" ||
            d.available === true,
          raw: d,
        };
      });

      setAllDoctors(normalized);
      setError("");
    } catch (err) {
      console.error(err);

      setError(
        "Network error while loading doctors."
      );

      setAllDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden py-4 pb-24 bg-gradient-to-b from-[#f8fbff] to-[#eef7ff] min-h-screen">
      {/* Background Blur */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-100/40 rounded-full blur-3xl"></div>

      <div className="absolute bottom-0 right-0 w-72 h-72 bg-cyan-100/40 rounded-full blur-3xl"></div>

      <div className="relative max-w-7xl mx-auto px-5 lg:px-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">


          <h1 className="mt-6 text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Meet Our
            <span className="block bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
              Medical Specialists
            </span>
          </h1>

          <p className="mt-6 text-slate-600 text-lg leading-relaxed">
            Find experienced doctors and
            book appointments quickly with
            trusted healthcare professionals.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mt-12">
          <div className="relative bg-white/70 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <input
              type="text"
              placeholder="Search doctors by name or specialization..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
              className="w-full bg-transparent py-4 pl-14 pr-14 text-slate-700 outline-none placeholder:text-slate-400"
            />

            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

            {searchTerm.length > 0 && (
              <button
                onClick={() =>
                  setSearchTerm("")
                }
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-10 max-w-xl mx-auto bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
            <p className="text-red-600 font-medium">
              {error}
            </p>

            <button
              onClick={retry}
              className="mt-4 px-5 py-2 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-all duration-300"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
            {Array.from({ length: 8 }).map(
              (_, i) => (
                <div
                  key={i}
                  className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-[30px] p-5 animate-pulse"
                >
                  <div className="h-56 rounded-2xl bg-slate-200"></div>

                  <div className="h-5 bg-slate-200 rounded mt-5"></div>

                  <div className="h-4 bg-slate-100 rounded mt-3 w-2/3"></div>

                  <div className="h-10 bg-slate-100 rounded-xl mt-6"></div>
                </div>
              )
            )}
          </div>
        ) : (
          <>
            {/* Doctors Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
              {displayedDoctors.length >
                0 ? (
                displayedDoctors.map(
                  (doctor, index) => (
                    <div
                      key={
                        doctor.id || index
                      }
                      className={`group bg-white/70 backdrop-blur-xl border border-slate-200 rounded-[32px] p-5 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 ${!doctor.available
                        ? "opacity-75"
                        : ""
                        }`}
                      style={{
                        animationDelay: `${index * 90}ms`,
                      }}
                    >
                      {/* Image */}
                      <div className="relative overflow-hidden rounded-3xl">
                        <img
                          src={
                            doctor.image ||
                            "/placeholder-doctor.jpg"
                          }
                          alt={doctor.name}
                          loading="lazy"
                          className={`w-full h-64 object-cover transition-transform duration-700 group-hover:scale-105 ${!doctor.available
                            ? "grayscale"
                            : ""
                            }`}
                          onError={(e) => {
                            e.currentTarget.onerror =
                              null;

                            e.currentTarget.src =
                              "/placeholder-doctor.jpg";
                          }}
                        />

                        {!doctor.available && (
                          <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                            Not Available
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="mt-5">
                        <h3 className="text-slate-900 font-bold text-xl">
                          {doctor.name}
                        </h3>

                        <p className="mt-1 text-sm font-medium text-emerald-600">
                          {
                            doctor.specialization
                          }
                        </p>

                        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-medium">
                          <Medal className="w-4 h-4 text-yellow-500" />

                          {
                            doctor.experience
                          }{" "}
                          Years Experience
                        </div>

                        {/* Button */}
                        <div className="mt-6">
                          {doctor.available ? (
                            <Link
                              to={`/doctors/${doctor.id}`}
                              state={{
                                doctor:
                                  doctor.raw ||
                                  doctor,
                              }}
                              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white py-3 rounded-2xl font-semibold hover:shadow-lg transition-all duration-300"
                            >
                              <ChevronRight className="w-5 h-5" />

                              Book Appointment
                            </Link>
                          ) : (
                            <button
                              disabled
                              className="w-full inline-flex items-center justify-center gap-2 bg-slate-200 text-slate-500 py-3 rounded-2xl font-semibold cursor-not-allowed"
                            >
                              <MousePointer2Off className="w-5 h-5" />

                              Not Available
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                )
              ) : (
                <div className="col-span-full text-center py-20">
                  <h3 className="text-2xl font-bold text-slate-800">
                    No Doctors Found
                  </h3>

                  <p className="mt-3 text-slate-500">
                    Try searching with
                    another specialization
                    or doctor name.
                  </p>
                </div>
              )}
            </div>

            {/* Show More */}
            {filteredDoctors.length >
              8 && (
                <div className="flex justify-center mt-14">
                  <button
                    onClick={() =>
                      setShowAll(!showAll)
                    }
                    className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg text-slate-700 font-semibold transition-all duration-300"
                  >
                    {showAll ? (
                      <>
                        <CircleChevronUp className="w-5 h-5 text-emerald-500" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <CircleChevronDown className="w-5 h-5 text-cyan-500" />
                        Show More
                      </>
                    )}
                  </button>
                </div>
              )}
          </>
        )}
      </div>
    </section>
  );
};

export default DoctorsPage;