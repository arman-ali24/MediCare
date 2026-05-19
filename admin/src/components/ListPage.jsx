import React, { useEffect, useMemo, useState } from "react";
import { doctorListStyles } from "../assets/dummyStyles";
import {
  BadgeIndianRupee,
  EyeClosed,
  Search,
  Star,
  Trash2,
  Users,
} from "lucide-react";

// HELPER FUNCTIONS
// This function will give you output as DD - MM - YYYY
function formatDateISO(iso) {
  if (!iso || typeof iso !== "string") return iso;
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "June",
    "July",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const day = String(Number(d));
  const month = monthNames[dateObj.getMonth()] || "";
  return `${day} ${month} ${y}`;
}

// It will normalize any date-like string
function normalizeToDateString(d) {
  if (!d) return null;
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString().split("T")[0];
}

// This function will normalize schedule map: ex - 'YYYY-MM-DD' : [slot1, slot2...]
// Also converts slots to array slots
function buildScheduleMap(schedule) {
  const map = {};
  if (!schedule || typeof schedule !== "object") return map;
  Object.entries(schedule).forEach(([k, v]) => {
    const nd = normalizeToDateString(k) || String(k);
    map[nd] = Array.isArray(v) ? v.slice() : [];
  });
  return map;
}

// This function gives past dates first
// That is nearest date comes first
function getSortedScheduleDates(scheduleLike) {
  let keys = [];
  if (Array.isArray(scheduleLike)) {
    keys = scheduleLike.map(normalizeToDateString).filter(Boolean);
  } else if (scheduleLike && typeof scheduleLike === "object") {
    keys = Object.keys(scheduleLike).map(normalizeToDateString).filter(Boolean);
  }

  keys = Array.from(new Set(keys));
  const parsed = keys.map((ds) => ({ ds, date: new Date(ds) }));
  const dateVal = (d) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());

  const today = new Date();
  const todayVal = dateVal(today);

  const past = parsed
    .filter((p) => dateVal(p.date) < todayVal)
    .sort((a, b) => dateVal(b.date) - dateVal(a.date));

  const future = parsed
    .filter((p) => dateVal(p.date) >= todayVal)
    .sort((a, b) => dateVal(a.date) - dateVal(b.date));

  return [...past, ...future].map((p) => p.ds);
}

const ListPage = () => {
  const API_BASE = "https://medicare-backend-t2oa.onrender.com";

  const [doctors, setDoctors] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(false);

  const [isMobileScreen, setIsMobileScreen] = useState(false);
  useEffect(() => {
    function onResize() {
      if (typeof window === "undefined") return;
      setIsMobileScreen(window.innerWidth < 640);
    }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // To fetch doctors from server
  async function fetchDoctors() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/doctors`);
      const body = await res.json().catch(() => null);

      if (res.ok && body && body.success) {
        const list = Array.isArray(body.data)
          ? body.data
          : Array.isArray(body.doctors)
            ? body.doctors
            : [];
        const normalized = list.map((d) => {
          const scheduleMap = buildScheduleMap(d.schedule || {});
          return {
            ...d,
            schedule: scheduleMap,
          };
        });
        setDoctors(normalized);
      } else {
        console.error("Failed to fetch doctors", { status: res.status, body });
        setDoctors([]);
      }
    } catch (err) {
      console.error("Network error fetching doctors", err);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDoctors();
  }, []);

  // To filter doctors
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = doctors;
    if (filterStatus === "available") {
      list = list.filter(
        (d) => (d.availability || "").toString().toLowerCase() === "available",
      );
    } else if (filterStatus === "unavailable") {
      list = list.filter(
        (d) => (d.availability || "").toString().toLowerCase() !== "available",
      );
    }
    if (!q) return list;
    return list.filter((d) => {
      return (
        (d.name || "").toLowerCase().includes(q) ||
        (d.specialization || "").toLowerCase().includes(q)
      );
    });
  }, [doctors, query, filterStatus]);

  // Show doctor according to filter
  const displayed = useMemo(() => {
    if (showAll) return filtered;
    return filtered.slice(0, 6);
  }, [filtered, showAll]);

  function toggle(id) {
    setExpanded((prev) => (prev === id ? null : id));
  }

  // To delete any doctor
  async function removeDoctor(id) {
    const doc = doctors.find((d) => (d._id || d.id) === id);
    if (!doc) return;
    const ok = window.confirm(`Delete ${doc.name}? This cannot be undone.`);
    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE}/api/doctors/${id}`, {
        method: "DELETE",
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        alert(body?.message || "Failed to delete");
        return;
      }
      setDoctors((prev) => prev.filter((p) => (p._id || p.id) !== id));
      if (expanded === id) setExpanded(null);
    } catch (err) {
      console.error("delete error", err);
      alert("Network error deleting doctor");
    }
  }

  // Shows all doctor or the filtered ones
  function applyStatusFilter(status) {
    setFilterStatus((prev) => (prev === status ? "all" : status));
    setExpanded(null);
    setShowAll(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-7xl mx-auto">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-[2rem] border border-emerald-100 bg-white/80 backdrop-blur-xl shadow-xl p-6 sm:p-8 mb-8">
          <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-100 rounded-full blur-3xl opacity-40" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold mb-4">
                <Users size={16} />
                Doctors List
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-slate-800 leading-tight">
                Hospital Doctor
                <span className="block bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                  Management Panel
                </span>
              </h1>

              <p className="mt-4 text-slate-600 max-w-2xl text-sm sm:text-base leading-relaxed">
                Manage doctors, schedules, availability, ratings and hospital
                staff information from one centralized panel.
              </p>
            </div>

            <div className="hidden lg:flex items-center justify-center">
              <div className="w-44 h-44 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center shadow-2xl">
                <Users size={80} className="text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH + FILTER */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-lg p-5 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search doctor, specialization..."
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

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => applyStatusFilter("available")}
                className={`
                px-5 py-3 rounded-2xl font-semibold transition-all duration-300
                ${filterStatus === "available"
                    ? "bg-emerald-500 text-white"
                    : "bg-emerald-50 text-emerald-600"
                  }
              `}
              >
                Available
              </button>

              <button
                onClick={() => applyStatusFilter("unavailable")}
                className={`
                px-5 py-3 rounded-2xl font-semibold transition-all duration-300
                ${filterStatus === "unavailable"
                    ? "bg-red-500 text-white"
                    : "bg-red-50 text-red-500"
                  }
              `}
              >
                Unavailable
              </button>

              <button
                onClick={() => {
                  setQuery("");
                  setExpanded(null);
                  setShowAll(false);
                  setFilterStatus("all");
                }}
                className="
                px-5 py-3 rounded-2xl
                bg-slate-900 text-white font-semibold
                hover:bg-slate-800 transition-all duration-300
              "
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="bg-white rounded-3xl p-10 text-center font-semibold text-slate-500 shadow-lg">
            Loading Doctors...
          </div>
        )}

        {/* EMPTY */}
        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-3xl p-10 text-center font-semibold text-slate-500 shadow-lg">
            No Doctors Match your Search.
          </div>
        )}

        {/* DOCTOR GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {displayed.map((doc) => {
            const id = doc._id || doc.id;
            const isOpen = expanded === id;
            const isAvailable = doc.availability === "Available";

            const scheduleMap = buildScheduleMap(doc.schedule || {});
            const sortedDated = getSortedScheduleDates(scheduleMap);

            return (
              <div
                key={id}
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
                  <div className="flex flex-col sm:flex-row gap-5">
                    <img
                      src={doc.imageUrl || doc.image || ""}
                      alt={doc.name}
                      className="
                      w-28 h-28 rounded-3xl object-cover
                      border border-slate-200 shadow-md
                    "
                    />

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-black text-slate-800">
                            {doc.name}
                          </h2>

                          <p className="text-slate-500 mt-1">
                            {doc.specialization}
                          </p>

                          <p className="text-sm text-slate-400 mt-1">
                            {doc.experience} Years Experience
                          </p>
                        </div>

                        <button
                          onClick={() => toggle(id)}
                          className="
                          w-12 h-12 rounded-2xl
                          bg-slate-100 hover:bg-slate-200
                          flex items-center justify-center
                          transition-all duration-300
                        "
                        >
                          <EyeClosed size={18} />
                        </button>
                      </div>

                      {/* BADGES */}
                      <div className="flex flex-wrap gap-3 mt-5">
                        <div
                          className={`
                          inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold
                          ${isAvailable
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-red-50 text-red-500"
                            }
                        `}
                        >
                          <span
                            className={`
                            w-2 h-2 rounded-full
                            ${isAvailable
                                ? "bg-emerald-500"
                                : "bg-red-500"
                              }
                          `}
                          />
                          {isAvailable ? "Available" : "Unavailable"}
                        </div>

                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-50 text-yellow-600 text-sm font-semibold">
                          <Star size={14} />
                          {doc.rating}
                        </div>

                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-50 text-cyan-600 text-sm font-semibold">
                          <BadgeIndianRupee size={14} />
                          {doc.fee}
                        </div>
                      </div>

                      {/* STATS */}
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs text-slate-500 font-semibold">
                            Patients
                          </p>

                          <h3 className="text-xl font-black text-slate-800 mt-1 flex items-center gap-2">
                            <Users size={18} />
                            {doc.patients}
                          </h3>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs text-slate-500 font-semibold">
                            Success Rate
                          </p>

                          <h3 className="text-xl font-black text-emerald-600 mt-1">
                            {doc.success}%
                          </h3>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* EXPANDED */}
                  {isOpen && (
                    <div className="mt-8 border-t border-slate-100 pt-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-black text-slate-800 mb-3">
                            About Doctor
                          </h3>

                          <p className="text-slate-600 leading-relaxed">
                            {doc.about || "No details available"}
                          </p>

                          <div className="mt-6">
                            <h4 className="font-bold text-slate-700 mb-2">
                              Qualifications
                            </h4>

                            <p className="text-slate-500">
                              {doc.qualifications || "N/A"}
                            </p>
                          </div>

                          <div className="mt-6">
                            <h4 className="font-bold text-slate-700 mb-2">
                              Location
                            </h4>

                            <p className="text-slate-500">
                              {doc.location || "Unknown"}
                            </p>
                          </div>
                        </div>

                        {/* SCHEDULE */}
                        <div>
                          <h3 className="text-lg font-black text-slate-800 mb-4">
                            Schedule
                          </h3>

                          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                            {sortedDated.length === 0 ? (
                              <div className="text-slate-400 text-sm">
                                No schedule available
                              </div>
                            ) : (
                              sortedDated.map((date) => {
                                const slots = scheduleMap[date] || [];

                                return (
                                  <div
                                    key={date}
                                    className="rounded-2xl bg-slate-50 p-4"
                                  >
                                    <div className="font-bold text-slate-700 mb-3">
                                      {formatDateISO(date)}
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                      {slots.map((s, i) => (
                                        <span
                                          key={i}
                                          className="
                                          px-3 py-2 rounded-xl
                                          bg-emerald-100 text-emerald-700
                                          text-xs font-semibold
                                        "
                                        >
                                          {s}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ACTIONS */}
                      <div className="mt-8 flex justify-end">
                        <button
                          onClick={() => removeDoctor(id)}
                          className="
                          inline-flex items-center gap-2
                          px-5 py-3 rounded-2xl
                          bg-red-500 text-white font-semibold
                          hover:bg-red-600
                          transition-all duration-300
                        "
                        >
                          <Trash2 size={16} />
                          Delete Doctor
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* SHOW MORE */}
        {filtered.length > 6 && (
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
                : `Show More (${filtered.length - 6})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListPage;
