import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import {
  Calendar,
  CheckCircle,
  XCircle,
  Users,
  Phone,
  BadgeIndianRupee,
  RefreshCw,
} from "lucide-react";

const API_BASE = "http://localhost:4000";

// ---------------- HELPERS ----------------

function parseDateTime(date, time) {
  return new Date(`${date}T${time}:00`);
}

function formatTimeAMPM(time24) {
  if (!time24) return "";
  const [hh, mm] = time24.split(":");
  let h = parseInt(hh, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${mm} ${ampm}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function backendToFrontendStatus(s) {
  if (!s) return "pending";
  const v = String(s).toLowerCase();

  if (v === "pending") return "pending";
  if (v === "confirmed") return "confirmed";
  if (v === "completed") return "complete";
  if (v === "canceled" || v === "cancelled") return "cancelled";
  if (v === "rescheduled") return "rescheduled";

  return v;
}

function frontendToBackendStatus(fs) {
  if (!fs) return "Pending";

  const v = String(fs).toLowerCase();

  if (v === "pending") return "Pending";
  if (v === "confirmed") return "Confirmed";
  if (v === "complete") return "Completed";
  if (v === "cancelled") return "Canceled";
  if (v === "rescheduled") return "Rescheduled";

  return fs;
}

function to24Hour(timeStr) {
  if (!timeStr) return "00:00";

  const m = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);

  if (!m) return timeStr;

  let hh = Number(m[1]);
  const mm = m[2];
  const ampm = m[3];

  if (!ampm) {
    return `${String(hh).padStart(2, "0")}:${mm}`;
  }

  const up = ampm.toUpperCase();

  if (up === "AM") {
    if (hh === 12) hh = 0;
  } else {
    if (hh !== 12) hh += 12;
  }

  return `${String(hh).padStart(2, "0")}:${mm}`;
}

function to12HourFrom24(hhmm) {
  if (!hhmm) return "12:00 AM";

  const [hh, mm] = hhmm.split(":").map(Number);

  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;

  return `${String(h12)}:${String(mm).padStart(2, "0")} ${ampm}`;
}

function normalizeAppointment(a) {
  if (!a) return null;

  const id = a._id || a.id || String(Math.random()).slice(2);

  const patient = a.patientName || a.patient || a.name || "Unknown";

  const age = a.age ?? a.patientAge ?? "";

  const gender = a.gender || "";

  const doctorName =
    (a.doctorId && typeof a.doctorId === "object" && a.doctorId.name) ||
    a.doctorName ||
    a.doctor ||
    "Doctor";

  const doctorImage =
    (a.doctorId && typeof a.doctorId === "object" && a.doctorId.imageUrl) ||
    a.doctorImage ||
    a.doctorImageUrl ||
    "";

  const speciality =
    (a.doctorId && (a.doctorId.specialization || a.doctorId.speciality)) ||
    a.speciality ||
    a.specialization ||
    "";

  const mobile = a.mobile || a.phone || "";

  const fee = Number(a.fees ?? a.fee ?? a.payment?.amount ?? 0) || 0;

  const date = a.date || (a.slot && a.slot.date) || "";

  const rawTime =
    a.time ||
    (a.slot && a.slot.time) ||
    (a.hour != null && a.minute != null
      ? `${String(a.hour).padStart(2, "0")}:${String(a.minute).padStart(
        2,
        "0"
      )}`
      : "");

  const time24 = to24Hour(rawTime);

  const status = backendToFrontendStatus(
    a.status || (a.payment && a.payment.status) || "Pending"
  );

  return {
    id,
    patient,
    age,
    gender,
    doctorName,
    doctorImage,
    speciality,
    mobile,
    date,
    time: time24,
    fee,
    status,
    raw: a,
  };
}

// ---------------- MAIN ----------------

export default function DashboardPage({ apiBase }) {
  const params = useParams();
  const location = useLocation();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  location.search;

  const API = apiBase || API_BASE;

  const doctorId = params.id;

  async function fetchAppointments() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${API}/api/appointments/doctor/${doctorId}`
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));

        throw new Error(
          body?.message || `Failed to fetch appointments (${res.status})`
        );
      }

      const body = await res.json();

      const list = Array.isArray(body.Appointments)
        ? body.Appointments
        : Array.isArray(body.appointments)
          ? body.appointments
          : Array.isArray(body)
            ? body
            : body.items ?? body.data ?? [];

      const normalized = (Array.isArray(list) ? list : [])
        .map(normalizeAppointment)
        .filter(Boolean);

      setAppointments(normalized);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load appointments");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAppointments();
  }, [API, doctorId]);

  const sorted = useMemo(() => {
    return [...appointments].sort(
      (a, b) => parseDateTime(b.date, b.time) - parseDateTime(a.date, a.time)
    );
  }, [appointments]);

  const topAppointments = sorted.slice(0, 12);

  const totalAppointments = appointments.length;

  const completedAppointments = appointments.filter(
    (a) => a.status === "complete"
  ).length;

  const cancelledAppointments = appointments.filter(
    (a) => a.status === "cancelled"
  ).length;

  const totalEarnings = appointments
    .filter((a) => a.status === "complete")
    .reduce((s, a) => s + (Number(a.fee) || 0), 0);

  async function updateStatusRemote(id, newStatusFrontend) {
    const appt = appointments.find((p) => p.id === id);

    if (!appt) return;

    if (appt.status === "complete" || appt.status === "cancelled") return;

    const backendStatus = frontendToBackendStatus(newStatusFrontend);

    setAppointments((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: newStatusFrontend } : p
      )
    );

    try {
      const res = await fetch(`${API}/api/appointments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: backendStatus,
        }),
      });

      if (!res.ok) {
        throw new Error("Status update failed");
      }
    } catch (err) {
      console.error(err);
      fetchAppointments();
    }
  }

  async function rescheduleRemote(id, newDate, newTime24) {
    const appt = appointments.find((p) => p.id === id);

    if (!appt) return;

    const time12 = to12HourFrom24(newTime24);

    try {
      await fetch(`${API}/api/appointments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: newDate,
          time: time12,
        }),
      });

      fetchAppointments();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}

        <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              Doctor Dashboard
            </h1>

            <p className="text-slate-500 mt-2">
              Manage appointments, earnings & patient schedules
            </p>
          </div>

          <button
            onClick={fetchAppointments}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        {/* STATS */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          <StatCard
            title="Total Appointments"
            value={totalAppointments}
            icon={<Calendar size={20} />}
            color="emerald"
          />

          <StatCard
            title="Total Earnings"
            value={`₹ ${totalEarnings}`}
            icon={<BadgeIndianRupee size={20} />}
            color="amber"
          />

          <StatCard
            title="Completed"
            value={completedAppointments}
            icon={<CheckCircle size={20} />}
            color="cyan"
          />

          <StatCard
            title="Cancelled"
            value={cancelledAppointments}
            icon={<XCircle size={20} />}
            color="rose"
          />
        </div>

        {/* APPOINTMENTS */}

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Latest Appointments
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Showing latest patient bookings
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold">
              <Users size={16} />
              {totalAppointments} Total
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-500">
              Loading appointments...
            </div>
          ) : error ? (
            <div className="p-10 text-center text-red-500">{error}</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 p-6">
              {topAppointments.map((a) => (
                <AppointmentCard
                  key={a.id}
                  appointment={a}
                  onStatusChange={updateStatusRemote}
                  onReschedule={rescheduleRemote}
                />
              ))}
            </div>
          )}

          <div className="p-6 border-t border-slate-100 text-center">
            <Link
              to={`/doctor-admin/${doctorId}/appointments`}
              className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-slate-900 text-white font-semibold hover:bg-emerald-500 transition-all duration-300"
            >
              Show More
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- STAT CARD ----------------

function StatCard({ title, value, icon, color }) {
  const colors = {
    emerald: "from-emerald-500 to-emerald-400",
    amber: "from-amber-500 to-yellow-400",
    cyan: "from-cyan-500 to-sky-400",
    rose: "from-rose-500 to-pink-400",
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-sm p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div
        className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${colors[color]}`}
      />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>

          <h3 className="mt-2 text-3xl font-black text-slate-900">
            {value}
          </h3>
        </div>

        <div
          className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colors[color]} flex items-center justify-center text-white shadow-lg`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

// ---------------- APPOINTMENT CARD ----------------

function AppointmentCard({
  appointment,
  onStatusChange,
  onReschedule,
}) {
  const [editing, setEditing] = useState(false);

  const [date, setDate] = useState(appointment.date);

  const [time, setTime] = useState(appointment.time);

  const terminal =
    appointment.status === "complete" ||
    appointment.status === "cancelled";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-xl transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center">
          {appointment.doctorImage ? (
            <img
              src={appointment.doctorImage}
              alt={appointment.doctorName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xl font-bold text-slate-500">
              {appointment.doctorName.charAt(0)}
            </span>
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-900">
            {appointment.patient}
          </h3>

          <p className="text-sm text-slate-500">
            {appointment.age} yrs • {appointment.gender}
          </p>

          <p className="mt-1 text-sm font-semibold text-emerald-600">
            {appointment.speciality}
          </p>

          <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            <Phone size={14} />
            {appointment.mobile}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-3">
        <div>
          <p className="text-sm text-slate-500">Appointment Date</p>

          <h4 className="font-bold text-slate-900">
            {formatDate(appointment.date)}
          </h4>
        </div>

        <div className="text-right">
          <p className="text-sm text-slate-500">Time</p>

          <h4 className="font-bold text-slate-900">
            {formatTimeAMPM(appointment.time)}
          </h4>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div className="text-2xl font-black text-slate-900">
          ₹{appointment.fee}
        </div>

        <select
          value={appointment.status}
          disabled={terminal}
          onChange={(e) =>
            onStatusChange(appointment.id, e.target.value)
          }
          className={`px-4 py-2 rounded-xl border text-sm font-semibold outline-none transition ${terminal
              ? "bg-slate-100 text-slate-400 border-slate-200"
              : "bg-white border-slate-300 hover:border-emerald-400"
            }`}
        >
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="complete">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* RESCHEDULE */}

      <div className="mt-5">
        {!editing ? (
          <button
            disabled={terminal}
            onClick={() => setEditing(true)}
            className={`w-full rounded-2xl py-3 font-semibold transition-all duration-300 ${terminal
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-emerald-500 text-white hover:bg-emerald-600 hover:-translate-y-0.5"
              }`}
          >
            Reschedule
          </button>
        ) : (
          <div className="space-y-3">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500"
            />

            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500"
            />

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  onReschedule(appointment.id, date, time);
                  setEditing(false);
                }}
                className="py-3 rounded-2xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition"
              >
                Save
              </button>

              <button
                onClick={() => setEditing(false)}
                className="py-3 rounded-2xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}