import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  X,
  ChevronRight,
  CircleChevronDown,
  CircleChevronUp,
  MousePointer2Off,
} from "lucide-react";

const PlaceholderImg = "/placeholder-service.jpg";

const ServicePage = () => {
  const API_BASE = "http://localhost:4000";

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`${API_BASE}/api/services`);
        const json = await res.json().catch(() => null);

        if (!res.ok) {
          setError(json?.message || "Failed to load services");
          setServices([]);
          return;
        }

        const items = json?.data || json || [];

        const normalized = (Array.isArray(items) ? items : []).map((s) => ({
          id: s._id || s.id,
          name: s.name || "Service",
          image: s.imageUrl || s.image || "",
          available:
            s.available === true ||
            s.availability === "Available",
          raw: s,
        }));

        if (mounted) setServices(normalized);
      } catch (err) {
        setError("Network error while loading services.");
        setServices([]);
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => (mounted = false);
  }, [API_BASE]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return services;

    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(q)
    );
  }, [services, search]);

  const visible = showAll ? filtered : filtered.slice(0, 8);

  return (
    <section className="relative overflow-hidden py-4 pb-24 bg-gradient-to-b from-[#f8fbff] to-[#eef7ff] min-h-screen">

      {/* Background blur (same as doctors page) */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-100/40 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-cyan-100/40 rounded-full blur-3xl"></div>

      <div className="relative max-w-7xl mx-auto px-5 lg:px-10">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="mt-6 text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Our
            <span className="block bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
              Diagnostic Services
            </span>
          </h1>

          <p className="mt-6 text-slate-600 text-lg">
            Safe, accurate and reliable medical testing services
            designed for better healthcare outcomes.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mt-12">
          <div className="relative bg-white/70 backdrop-blur-xl border border-slate-200 rounded-2xl overflow-hidden">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search services..."
              className="w-full py-4 pl-14 pr-14 bg-transparent outline-none text-slate-700"
            />

            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-5 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-10 max-w-xl mx-auto bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-[32px] p-5 animate-pulse"
              >
                <div className="h-56 bg-slate-200 rounded-2xl"></div>
                <div className="h-5 bg-slate-200 mt-5 rounded"></div>
                <div className="h-10 bg-slate-100 mt-6 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">

              {visible.length > 0 ? (
                visible.map((s, i) => (
                  <div
                    key={s.id}
                    className="group bg-white/70 backdrop-blur-xl border border-slate-200 rounded-[32px] p-5 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500"
                  >
                    <img
                      src={s.image || PlaceholderImg}
                      alt={s.name}
                      className="w-full h-56 object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500"
                    />

                    <h3 className="mt-5 text-xl font-bold text-slate-900">
                      {s.name}
                    </h3>

                    <div className="mt-6">
                      {s.available ? (
                        <Link
                          to={`/services/${s.id}`}
                          state={{ service: s.raw }}
                          className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white py-3 rounded-2xl font-semibold"
                        >
                          <ChevronRight className="w-5 h-5" />
                          Book Now
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="w-full inline-flex items-center justify-center gap-2 bg-slate-200 text-slate-500 py-3 rounded-2xl"
                        >
                          <MousePointer2Off className="w-5 h-5" />
                          Not Available
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-20">
                  No Services Found
                </div>
              )}
            </div>

            {/* Show More */}
            {filtered.length > 8 && (
              <div className="flex justify-center mt-14">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="px-6 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm font-semibold"
                >
                  {showAll ? (
                    <>
                      <CircleChevronUp className="inline w-5 h-5 text-emerald-500 mr-2" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <CircleChevronDown className="inline w-5 h-5 text-cyan-500 mr-2" />
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

export default ServicePage;
