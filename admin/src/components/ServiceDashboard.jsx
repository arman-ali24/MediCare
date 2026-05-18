import React, { useEffect, useMemo, useRef, useState } from "react";
import { serviceDashboardStyles } from "../assets/dummyStyles";
import {
  BadgeIndianRupee,
  Calendar,
  CheckCircle,
  ClipboardList,
  Search,
  XCircle,
} from "lucide-react";

// Normalize the backend data that is coming from the DB
function normalizeService(doc) {
  if (!doc) return null;
  const id = doc._id || doc.id || String(Math.random()).slice(2);
  const name = doc.name || doc.title || doc.serviceName || "Untitled Service";
  const price =
    Number(doc.price ?? doc.fee ?? doc.fees ?? doc.cost ?? doc.amount) || 0;
  const image =
    doc.imageUrl ||
    doc.image ||
    doc.avatar ||
    `https://i.pravatar.cc/150?u=${id}`;
  // various possible stat shapes
  const totalAppointments =
    doc.totalAppointments ??
    doc.appointments?.total ??
    doc.count ??
    doc.stats?.total ??
    doc.bookings ??
    0;
  const completed =
    doc.completed ??
    doc.appointments?.completed ??
    doc.stats?.completed ??
    doc.completedAppointments ??
    0;
  const canceled =
    doc.canceled ??
    doc.appointments?.canceled ??
    doc.stats?.canceled ??
    doc.canceledAppointments ??
    0;

  return {
    id,
    name,
    price,
    image,
    totalAppointments: Number(totalAppointments) || 0,
    completed: Number(completed) || 0,
    canceled: Number(canceled) || 0,
    raw: doc,
  };
}

const API_BASE = "http://localhost:4000";

const ServiceDashboard = ({ services: servicesProp = null }) => {
  const [services, setServices] = useState(
    Array.isArray(servicesProp) ? servicesProp.map(normalizeService) : [],
  );
  const [loading, setLoading] = useState(!Array.isArray(servicesProp));
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const mountedRef = useRef(true);
  const fetchingRef = useRef(false);
  const pollHandleRef = useRef(null);

  // Helper function to fetch options
  function buildFetchOptions() {
    const opts = {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    };
    const token = localStorage.getItem("authToken");
    if (token) opts.headers["Authorization"] = `Bearer ${token}`;
    return opts;
  }

  // Fetch the service from the server side
  async function fetchServices({ showLoading = true } = {}) {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      if (showLoading) {
        setLoading(true);
        setError(null);
      }

      const url = `${API_BASE}/api/service-appointments/stats/summary`;
      const res = await fetch(url, buildFetchOptions());
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body?.message || `Failed to fetch services (${res.status})`,
        );
      }
      const body = await res.json();

      let list = [];
      if (Array.isArray(body)) list = body;
      else if (Array.isArray(body.services)) list = body.services;
      else if (Array.isArray(body.data)) list = body.data;
      else if (Array.isArray(body.items)) list = body.items;
      else {
        const maybeArray = Object.values(body).find((v) => Array.isArray(v));
        if (maybeArray) list = maybeArray;
      }

      const normalized = (list || []).map(normalizeService).filter(Boolean);
      if (mountedRef.current) {
        setServices(normalized);
        setError(null);
      }
    } catch (err) {
      console.error("Service fetch error:", err);
      if (mountedRef.current) {
        setError(err.message || "Failed to load services");
      }
    } finally {
      if (mountedRef.current && showLoading) setLoading(false);
      fetchingRef.current = false;
    }
  }

  useEffect(() => {
    window.refreshServices = () => fetchServices({ showLoading: true });
    return () => {
      try {
        delete window.refreshServices;
      } catch { }
    };
  }, []); // Global helper to refresh the page and fetch the services again

  // Makes sure that services are present
  useEffect(() => {
    mountedRef.current = true;
    if (Array.isArray(servicesProp)) {
      setServices(servicesProp.map(normalizeService));
      setLoading(false);
      return () => {
        mountedRef.current = false;
      };
    }

    fetchServices({ showLoading: true });

    // A polling while tab is visible
    function startPolling() {
      if (pollHandleRef.current) return;
      pollHandleRef.current = setInterval(() => {
        if (document.visibilityState === "visible")
          fetchServices({ showLoading: false });
      }, 10000);
    }

    function stopPolling() {
      if (pollHandleRef.current) {
        clearInterval(pollHandleRef.current);
        pollHandleRef.current = null;
      }
    }
    startPolling();

    // Refresh the onFocus
    function onFocus() {
      fetchServices({ showLoading: false });
    }
    window.addEventListener("focus", onFocus);

    function onServicesUpdated() {
      fetchServices({ showLoading: false });
    }
    window.addEventListener("services:updated", onServicesUpdated);

    // Refresh the localstorage
    function onStorage(e) {
      if (e?.key === "service_bookings_updated") {
        fetchServices({ showLoading: false });
      }
    }
    window.addEventListener("storage", onStorage);

    // Also refresh the tab when becomes visible
    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        fetchServices({ showLoading: false });
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      mountedRef.current = false;
      stopPolling();
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("services:updated", onServicesUpdated);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [servicesProp]);

  // Filtering + Searching...
  const filteredServices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return services;
    const qNum = Number(q);
    return services.filter((s) => {
      if (s.name.toLowerCase().includes(q)) return true;
      if (!Number.isNaN(qNum) && s.price <= qNum) return true;
      if (s.price.toString().includes(q)) return true;
      return false;
    });
  }, [services, searchQuery]);

  const INITIAL_COUNT = 8;
  const visibleServices = showAll
    ? filteredServices
    : filteredServices.slice(0, INITIAL_COUNT);

  // Stats
  const totals = useMemo(() => {
    return filteredServices.reduce(
      (acc, s) => {
        acc.totalServices += 1;
        acc.totalAppointments += s.totalAppointments;
        acc.totalCompleted += s.completed;
        acc.totalCanceled += s.canceled;
        acc.totalEarning += s.completed * s.price;
        return acc;
      },
      {
        totalServices: 0,
        totalAppointments: 0,
        totalCompleted: 0,
        totalCanceled: 0,
        totalEarning: 0,
      },
    );
  }, [filteredServices]);

  function formatCurrency(v) {
    return `₹${Number(v || 0).toLocaleString()}`;
  }

  // UI PART
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-7xl mx-auto">

        {/* HERO SECTION */}
        <div className="relative overflow-hidden rounded-[2rem] border border-emerald-100 bg-white/80 backdrop-blur-xl shadow-xl p-6 sm:p-8 mb-8">
          <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-100 rounded-full blur-3xl opacity-40" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold mb-4">
                <ClipboardList size={16} />
                Service Analytics
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-slate-800 leading-tight">
                Service
                <span className="block bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                  Dashboard Panel
                </span>
              </h1>

              <p className="mt-4 text-slate-600 max-w-2xl text-sm sm:text-base leading-relaxed">
                Monitor service performance, appointments, earnings and business
                analytics from one centralized admin dashboard.
              </p>
            </div>

            <div className="hidden lg:flex items-center justify-center">
              <div className="w-44 h-44 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center shadow-2xl">
                <ClipboardList size={80} className="text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5 mb-8">

          <PremiumStatCard
            icon={<ClipboardList size={20} />}
            label="Total Services"
            value={totals.totalServices}
            color="emerald"
          />

          <PremiumStatCard
            icon={<Calendar size={20} />}
            label="Appointments"
            value={totals.totalAppointments}
            color="cyan"
          />

          <PremiumStatCard
            icon={<CheckCircle size={20} />}
            label="Completed"
            value={totals.totalCompleted}
            color="green"
          />

          <PremiumStatCard
            icon={<XCircle size={20} />}
            label="Canceled"
            value={totals.totalCanceled}
            color="red"
          />

          <PremiumStatCard
            icon={<BadgeIndianRupee size={20} />}
            label="Revenue"
            value={formatCurrency(totals.totalEarning)}
            color="yellow"
          />
        </div>

        {/* SEARCH + ACTIONS */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-lg p-5 mb-8">

          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">

            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search service, price..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="
                w-full rounded-2xl border border-slate-200
                bg-slate-50 px-5 py-3 pr-12
                text-sm font-medium outline-none
                focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100
                transition-all duration-300
              "
              />

              <Search
                size={18}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            <div className="flex gap-3 flex-wrap">

              <button
                onClick={() => setSearchQuery("")}
                className="
                px-5 py-3 rounded-2xl
                bg-slate-900 text-white font-semibold
                hover:bg-slate-800 transition-all duration-300
              "
              >
                Clear
              </button>

              <button
                onClick={() => fetchServices({ showLoading: true })}
                className="
                px-5 py-3 rounded-2xl
                bg-emerald-500 text-white font-semibold
                hover:bg-emerald-600 transition-all duration-300
              "
              >
                Refresh
              </button>

            </div>
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="bg-white rounded-3xl p-10 text-center font-semibold text-slate-500 shadow-lg">
            Loading Services...
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-3xl p-8 text-center font-semibold shadow-lg">
            {error}
          </div>
        )}

        {/* EMPTY */}
        {!loading && !error && visibleServices.length === 0 && (
          <div className="bg-white rounded-3xl p-10 text-center font-semibold text-slate-500 shadow-lg">
            No Services Found.
          </div>
        )}

        {/* SERVICE GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {visibleServices.map((s) => {
            const earning = s.completed * s.price;

            return (
              <div
                key={s.id}
                className="
                group overflow-hidden
                rounded-[2rem]
                border border-slate-200
                bg-white/80 backdrop-blur-xl
                shadow-xl
                hover:-translate-y-1 hover:shadow-2xl
                transition-all duration-300
              "
              >
                <div className="p-6">

                  {/* TOP */}
                  <div className="flex gap-5">

                    <img
                      src={s.image}
                      alt={s.name}
                      className="
                      w-28 h-28 rounded-3xl object-cover
                      border border-slate-200 shadow-md
                    "
                    />

                    <div className="flex-1">

                      <div className="flex items-start justify-between gap-4">

                        <div>
                          <h2 className="text-2xl font-black text-slate-800">
                            {s.name}
                          </h2>

                          <p className="text-slate-500 mt-2">
                            Premium Healthcare Service
                          </p>
                        </div>

                        <div className="px-4 py-2 rounded-2xl bg-emerald-50 text-emerald-600 font-bold">
                          {formatCurrency(s.price)}
                        </div>

                      </div>

                      {/* BADGES */}
                      <div className="flex flex-wrap gap-3 mt-5">

                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-50 text-cyan-600 text-sm font-semibold">
                          <Calendar size={14} />
                          {s.totalAppointments} Appointments
                        </div>

                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 text-sm font-semibold">
                          <CheckCircle size={14} />
                          {s.completed} Completed
                        </div>

                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-red-500 text-sm font-semibold">
                          <XCircle size={14} />
                          {s.canceled} Canceled
                        </div>

                      </div>

                      {/* STATS */}
                      <div className="grid grid-cols-2 gap-4 mt-6">

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs text-slate-500 font-semibold">
                            Revenue
                          </p>

                          <h3 className="text-xl font-black text-emerald-600 mt-1">
                            {formatCurrency(earning)}
                          </h3>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs text-slate-500 font-semibold">
                            Success Rate
                          </p>

                          <h3 className="text-xl font-black text-slate-800 mt-1">
                            {s.totalAppointments > 0
                              ? `${Math.round(
                                (s.completed / s.totalAppointments) * 100,
                              )}%`
                              : "0%"}
                          </h3>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* SHOW MORE */}
        {filteredServices.length > INITIAL_COUNT && (
          <div className="flex justify-center py-10">
            <button
              onClick={() => setShowAll((s) => !s)}
              className="
              px-8 py-4 rounded-2xl
              bg-slate-900 text-white font-semibold
              hover:scale-105 transition-all duration-300
            "
            >
              {showAll
                ? "Show Less"
                : `Show More (${filteredServices.length - INITIAL_COUNT})`}
            </button>
          </div>
        )}

      </div>
    </div>
  );

  /* ===========================
     PREMIUM STAT CARD
  =========================== */

  function PremiumStatCard({ icon, label, value, color }) {

    const colors = {
      emerald: "from-emerald-500 to-green-500",
      cyan: "from-cyan-500 to-sky-500",
      green: "from-green-500 to-emerald-500",
      red: "from-red-500 to-rose-500",
      yellow: "from-yellow-500 to-orange-500",
    };

    return (
      <div className="
      relative overflow-hidden
      rounded-3xl border border-slate-200
      bg-white/80 backdrop-blur-xl
      shadow-lg p-5
      hover:-translate-y-1 hover:shadow-2xl
      transition-all duration-300
    ">

        <div className={`
        absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20
        bg-gradient-to-br ${colors[color]}
      `} />

        <div className="relative z-10 flex items-center justify-between">

          <div>
            <p className="text-sm font-semibold text-slate-500">
              {label}
            </p>

            <h3 className="text-3xl font-black text-slate-800 mt-2">
              {value}
            </h3>
          </div>

          <div className={`
          w-14 h-14 rounded-2xl text-white
          flex items-center justify-center shadow-lg
          bg-gradient-to-br ${colors[color]}
        `}>
            {icon}
          </div>

        </div>
      </div>
    );
  }
};

export default ServiceDashboard;

function StatCard({ icon, label, value }) {
  return (
    <div className={serviceDashboardStyles.statCard.container}>
      <div className={serviceDashboardStyles.statCard.iconContainer}>
        {icon}
      </div>
      <div>
        <div className={serviceDashboardStyles.statCard.label}>{label}</div>
        <div className={serviceDashboardStyles.statCard.value}>{value}</div>
      </div>
    </div>
  );
}
