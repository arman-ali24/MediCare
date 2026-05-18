import React, { useEffect, useMemo, useState } from "react";
import {
  pageStyles,
  statusClasses,
  keyframesStyles,
} from "../assets/dummyStyles";
import { Calendar, Search, BadgeIndianRupee } from "lucide-react";

const API_BASE = "http://localhost:4000";

// HELPERS FUNCTION
// This function returns the date as 23 Apr 2026
function formatDateISO(iso) {
  try {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch (e) {
    return iso;
  }
}

// This function takes slot with date time and returns a date obj
function dateTimeFromSlot(slot) {
  try {
    const [y, m, d] = slot.date.split("-");
    const base = new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0);

    const [time, ampm] = slot.time.split(" ");
    let [hh, mm] = time.split(":").map(Number);
    if (ampm === "PM" && hh !== 12) hh += 12;
    if (ampm === "AM" && hh === 12) hh = 0;
    base.setHours(hh, mm, 0, 0);
    return base;
  } catch (e) {
    return new Date(slot.date + "T00:00:00");
  }
}

const AppointmentsPage = () => {
  const isAdmin = true; // As the admin is logged in and is major admin for response send by him

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterSpeciality, setFilterSpeciality] = useState("all");
  const [showAll, setShowAll] = useState(false);

  // Fetch list from server
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const q = query.trim();
        const url = `${API_BASE}/api/appointments?limit=200${q ? `&search=${encodeURIComponent(q)}` : ""
          }`;
        const res = await fetch(url);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.message || `Failed to fetch (${res.status})`);
        }
        const data = await res.json();
        const items = (data?.appointments || []).map((a) => {
          const doctorName =
            (a.doctorId && a.doctorId.name) || a.doctorName || "";
          const speciality =
            (a.doctorId && a.doctorId.specialization) ||
            a.speciality ||
            a.specialization ||
            "General";
          const fee = typeof a.fees === "number" ? a.fees : a.fee || 0;
          return {
            id: a._id || a.id,
            patientName: a.patientName || "",
            age: a.age || "",
            gender: a.gender || "",
            mobile: a.mobile || "",
            doctorName,
            speciality,
            fee,
            slot: {
              date: a.date || (a.slot && a.slot.date) || "",
              time: a.time || (a.slot && a.slot.time) || "00:00 AM",
            },
            status: a.status || (a.payment && a.payment.status) || "Pending",
            raw: a, // keep original in case we need it
          };
        });
        setAppointments(items); // Fetch all the details present on the DB
      } catch (err) {
        console.error("Load appointments error:", err);
        setError(err.message || "Failed to load appointments");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Compute available specialities from fetched appointments
  const specialities = useMemo(() => {
    const set = new Set(appointments.map((a) => a.speciality || "General"));
    return ["all", ...Array.from(set)];
  }, [appointments]);

  // Filter by speciality, date & query
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return appointments.filter((a) => {
      if (
        filterSpeciality !== "all" &&
        (a.speciality || "").toLowerCase() !== filterSpeciality.toLowerCase()
      )
        return false;
      if (filterDate && a.slot?.date !== filterDate) return false;
      if (!q) return true;
      return (
        (a.doctorName || "").toLowerCase().includes(q) ||
        (a.speciality || "").toLowerCase().includes(q) ||
        (a.patientName || "").toLowerCase().includes(q) ||
        (a.mobile || "").toLowerCase().includes(q)
      );
    });
  }, [appointments, query, filterDate, filterSpeciality]);

  // Sort filtered by datetime in descending order
  const sortedFiltered = useMemo(() => {
    return filtered.slice().sort((a, b) => {
      const da = dateTimeFromSlot(a.slot).getTime();
      const db = dateTimeFromSlot(b.slot).getTime();
      return db - da;
    });
  }, [filtered]);

  // Display all the appt or the filtered ones
  const displayed = useMemo(
    () => (showAll ? sortedFiltered : sortedFiltered.slice(0, 8)),
    [sortedFiltered, showAll],
  );

  // If admin want to cancel
  async function adminCancelAppointment(id) {
    const appt = appointments.find((x) => x.id === id);
    if (!appt) return;

    const statusLower = (appt.status || "").toLowerCase();
    const isCancelled =
      statusLower === "canceled" || statusLower === "cancelled";
    const isCompleted = statusLower === "completed";

    // Dont allow cancel or complete to be overdone
    if (isCancelled || isCompleted) return;

    const ok = window.confirm(
      `As admin, mark appointment for ${appt.patientName} with ${appt.doctorName
      } on ${formatDateISO(appt.slot.date)} at ${appt.slot.time} as CANCELLED?`,
    );
    if (!ok) return;

    try {
      setAppointments((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "Canceled" } : p)),
      );
      setShowAll(true);

      const res = await fetch(`${API_BASE}/api/appointments/${id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || `Cancel failed (${res.status})`);
      }
      const data = await res.json();
      const updated = data?.appointment || data?.appointments || null;
      if (updated) {
        setAppointments((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                ...p,
                status: updated.status || "Canceled",
                slot: {
                  date: updated.date || p.slot.date,
                  time: updated.time || p.slot.time,
                },
                raw: updated,
              }
              : p,
          ),
        );
      }
    } catch (err) {
      console.error("Cancel error:", err);
      setError(err.message || "Failed to cancel appointment");
      try {
        const reload = await fetch(`${API_BASE}/api/appointments?limit=200`);
        if (reload.ok) {
          const body = await reload.json();
          const items = (body?.appointments || []).map((a) => ({
            id: a._id || a.id,
            patientName: a.patientName || "",
            age: a.age || "",
            gender: a.gender || "",
            mobile: a.mobile || "",
            doctorName: (a.doctorId && a.doctorId.name) || a.doctorName || "",
            speciality:
              (a.doctorId && a.doctorId.specialization) ||
              a.speciality ||
              a.specialization ||
              "General",
            fee: typeof a.fees === "number" ? a.fees : a.fee || 0,
            slot: {
              date: a.date || (a.slot && a.slot.date) || "",
              time: a.time || (a.slot && a.slot.time) || "00:00 AM",
            },
            status: a.status || (a.payment && a.payment.status) || "Pending",
            raw: a,
          }));
          setAppointments(items);
        }
      } catch (e) {
        // Ignore any errors if occur
      }
    }
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
                <Calendar size={16} />
                Appointments Dashboard
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-slate-800 leading-tight">
                Hospital Appointment
                <span className="block bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                  Management Panel
                </span>
              </h1>

              <p className="mt-4 text-slate-600 max-w-2xl text-sm sm:text-base leading-relaxed">
                Manage patient bookings, cancellations and appointment schedules
                from one centralized admin dashboard.
              </p>
            </div>

            <div className="hidden lg:flex items-center justify-center">
              <div className="w-44 h-44 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center shadow-2xl">
                <Calendar size={80} className="text-white" />
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
                placeholder="Search doctor, patient, speciality or mobile..."
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
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="
              px-4 py-3 rounded-2xl border border-slate-200
              bg-slate-50 text-sm font-medium outline-none
              focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100
            "
              />

              <select
                value={filterSpeciality}
                onChange={(e) => setFilterSpeciality(e.target.value)}
                className="
              px-4 py-3 rounded-2xl border border-slate-200
              bg-slate-50 text-sm font-medium outline-none
              focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100
            "
              >
                {specialities.map((s) => (
                  <option key={s} value={s}>
                    {s === "all" ? "All Specialities" : s}
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  setQuery("");
                  setFilterDate("");
                  setFilterSpeciality("all");
                  setShowAll(false);
                  setError(null);
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
            Loading Appointments...
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-3xl p-6 text-red-500 font-semibold shadow-lg mb-6">
            {error}
          </div>
        )}

        {/* EMPTY */}
        {!loading && sortedFiltered.length === 0 && (
          <div className="bg-white rounded-3xl p-10 text-center font-semibold text-slate-500 shadow-lg">
            No Appointments Found.
          </div>
        )}

        {/* APPOINTMENT GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {displayed.map((a) => {
            const statusLower = (a.status || "").toLowerCase();

            const isCancelled =
              statusLower === "canceled" ||
              statusLower === "cancelled";

            const isCompleted = statusLower === "completed";

            const isDisabled = isCancelled || isCompleted;

            return (
              <div
                key={a.id}
                className="
              overflow-hidden rounded-[2rem]
              border border-slate-200
              bg-white/80 backdrop-blur-xl
              shadow-xl hover:-translate-y-1
              hover:shadow-2xl transition-all duration-300
            "
              >
                <div className="p-6">
                  {/* TOP */}
                  <div className="flex flex-col sm:flex-row justify-between gap-5">
                    <div>
                      <h2 className="text-2xl font-black text-slate-800">
                        {a.patientName}
                      </h2>

                      <div className="flex flex-wrap gap-2 mt-2 text-sm text-slate-500">
                        <span>{a.age} yrs</span>
                        <span>•</span>
                        <span>{a.gender}</span>
                        <span>•</span>
                        <span>{a.mobile}</span>
                      </div>

                      <p className="mt-3 text-slate-600 font-semibold">
                        {a.doctorName}
                      </p>

                      <p className="text-sm text-slate-400">
                        {a.speciality}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-semibold text-slate-400">
                        Fees
                      </div>

                      <div className="flex items-center justify-end gap-1 text-2xl font-black text-emerald-600 mt-2">
                        <BadgeIndianRupee size={20} />
                        {a.fee}
                      </div>
                    </div>
                  </div>

                  {/* DETAILS */}
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs text-slate-500 font-semibold">
                        Appointment Date
                      </p>

                      <h3 className="text-sm font-bold text-slate-800 mt-1">
                        {formatDateISO(a.slot.date)}
                      </h3>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs text-slate-500 font-semibold">
                        Time Slot
                      </p>

                      <h3 className="text-sm font-bold text-slate-800 mt-1">
                        {a.slot.time}
                      </h3>
                    </div>
                  </div>

                  {/* FOOTER */}
                  <div className="flex items-center justify-between gap-4 mt-6 flex-wrap">
                    <div
                      className={`
                    px-4 py-2 rounded-full text-sm font-semibold
                    ${isCompleted
                          ? "bg-emerald-100 text-emerald-600"
                          : isCancelled
                            ? "bg-red-100 text-red-500"
                            : "bg-yellow-100 text-yellow-600"
                        }
                  `}
                    >
                      {a.status?.toUpperCase()}
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => adminCancelAppointment(a.id)}
                        disabled={isDisabled}
                        className={`
                      px-5 py-3 rounded-2xl
                      font-semibold transition-all duration-300
                      ${isDisabled
                            ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                            : "bg-red-500 hover:bg-red-600 text-white"
                          }
                    `}
                      >
                        {isCompleted
                          ? "Completed"
                          : isCancelled
                            ? "Cancelled"
                            : "Cancel Appointment"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* SHOW MORE */}
        {sortedFiltered.length > 8 && (
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
                : `Show More (${sortedFiltered.length - 8})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentsPage;
