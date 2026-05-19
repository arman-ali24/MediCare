import React, { useEffect, useMemo, useState } from "react";
import { listPageStyles } from "../assets/dummyStyles";
import { useParams } from "react-router-dom";
import {
  Calendar,
  Phone,
  Search,
  X,
  RefreshCw,
  Users,
} from "lucide-react";

const API_BASE = "https://medicare-backend-t2oa.onrender.com";

// ================= HELPERS =================

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

function to24HourFromMaybe12(timeStr) {
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

function backendToFrontendStatus(s) {
  if (!s) return "pending";

  const v = String(s).toLowerCase();

  if (v === "pending") return "pending";
  if (v === "confirmed") return "confirmed";
  if (v === "completed" || v === "complete") return "complete";
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

function normalizeAppointment(a) {
  if (!a) return null;

  const id = a._id || a.id || String(Math.random()).slice(2);

  const patient = a.patientName || a.patient || a.name || "Unknown";

  const age = a.age ?? a.patientAge ?? "";

  const gender = a.gender || "";

  const doctorName =
    (a.doctorId && a.doctorId.name) ||
    a.doctorName ||
    a.doctor ||
    "";

  const doctorImage =
    (a.doctorId && (a.doctorId.imageUrl || a.doctorId.image)) ||
    a.doctorImage ||
    a.doctorImageUrl ||
    "";

  const speciality =
    (a.doctorId &&
      (a.doctorId.specialization || a.doctorId.speciality)) ||
    a.speciality ||
    a.specialization ||
    "";

  const mobile = a.mobile || a.phone || "";

  const fee =
    Number(a.fees ?? a.fee ?? a.payment?.amount ?? 0) || 0;

  const date = a.date || (a.slot && a.slot.date) || "";

  const rawTime =
    a.time ||
    (a.slot && a.slot.time) ||
    (a.hour != null
      ? `${String(a.hour).padStart(2, "0")}:${String(
        a.minute || 0,
      ).padStart(2, "0")}`
      : "");

  const time = to24HourFromMaybe12(rawTime);

  const status = backendToFrontendStatus(
    a.status || a.payment?.status || "pending",
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
    time,
    fee,
    status,
    raw: a,
  };
}

// ================= STATUS BADGE =================

function StatusBadge({ status }) {
  const styles = {
    pending:
      "bg-amber-50 text-amber-700 border border-amber-200",
    confirmed:
      "bg-blue-50 text-blue-700 border border-blue-200",
    complete:
      "bg-emerald-50 text-emerald-700 border border-emerald-200",
    cancelled:
      "bg-rose-50 text-rose-700 border border-rose-200",
    rescheduled:
      "bg-purple-50 text-purple-700 border border-purple-200",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]
        }`}
    >
      {status === "complete"
        ? "Completed"
        : status === "cancelled"
          ? "Cancelled"
          : status === "confirmed"
            ? "Confirmed"
            : status === "rescheduled"
              ? "Rescheduled"
              : "Pending"}
    </span>
  );
}

// ================= STATUS SELECT =================

function StatusSelect({ appointment, onChange }) {
  const terminal =
    appointment.status === "complete" ||
    appointment.status === "cancelled";

  return (
    <select
      value={appointment.status}
      onChange={(e) => onChange(e.target.value)}
      disabled={terminal}
      className={`
        px-3 py-2 rounded-xl text-sm font-medium outline-none
        border border-slate-200 bg-white
        transition-all duration-300
        ${terminal
          ? "opacity-60 cursor-not-allowed"
          : "hover:border-emerald-300 focus:border-emerald-400"
        }
      `}
    >
      <option value="pending">Pending</option>
      <option value="confirmed">Confirmed</option>
      <option value="complete">Completed</option>
      <option value="cancelled">Cancelled</option>
      <option value="rescheduled">Rescheduled</option>
    </select>
  );
}

// ================= RESCHEDULE =================

function RescheduleButton({ appointment, onReschedule }) {
  const terminal =
    appointment.status === "complete" ||
    appointment.status === "cancelled";

  const [editing, setEditing] = useState(false);

  const [date, setDate] = useState(appointment.date || "");

  const [time, setTime] = useState(
    appointment.time || "09:00",
  );

  const minDate = useMemo(() => {
    const d = new Date();

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${y}-${m}-${day}`;
  }, []);

  function save() {
    onReschedule(date, time);
    setEditing(false);
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        disabled={terminal}
        className={`
          px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300
          ${terminal
            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
            : "bg-emerald-500 text-white hover:bg-emerald-600 hover:-translate-y-0.5"
          }
        `}
      >
        Reschedule
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 mt-3">
      <input
        type="date"
        min={minDate}
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="px-3 py-2 rounded-xl border border-slate-200 outline-none"
      />

      <input
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        className="px-3 py-2 rounded-xl border border-slate-200 outline-none"
      />

      <div className="flex gap-2">
        <button
          onClick={save}
          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-xl font-semibold transition-all duration-300"
        >
          Save
        </button>

        <button
          onClick={() => setEditing(false)}
          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl font-semibold transition-all duration-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ================= MAIN PAGE =================

const ListPage = () => {
  const params = useParams();

  const doctorId = params.id;

  const [appointments, setAppointments] = useState([]);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  // ================= FETCH =================

  async function fetchAppointments() {
    setLoading(true);
    setError(null);

    try {
      const url = `${API_BASE}/api/appointments/doctor/${doctorId}`;

      const res = await fetch(url);

      const body = await res.json();

      if (!res.ok) {
        throw new Error(
          body?.message ||
          `Failed to fetch appointments`,
        );
      }

      const list =
        body?.appointments ||
        body?.data ||
        body?.items ||
        [];

      const normalized = list
        .map(normalizeAppointment)
        .filter(Boolean);

      setAppointments(normalized);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (doctorId) {
      fetchAppointments();
    }
  }, [doctorId]);

  // ================= UPDATE STATUS =================

  async function updateStatusRemote(id, newStatus) {
    const backendStatus =
      frontendToBackendStatus(newStatus);

    setAppointments((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: newStatus } : p,
      ),
    );

    try {
      await fetch(`${API_BASE}/api/appointments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: backendStatus,
        }),
      });
    } catch (err) {
      console.error(err);
    }
  }

  // ================= RESCHEDULE =================

  async function rescheduleRemote(
    id,
    newDate,
    newTime24,
  ) {
    const time12 = to12HourFrom24(newTime24);

    setAppointments((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
            ...p,
            date: newDate,
            time: newTime24,
            status: "rescheduled",
          }
          : p,
      ),
    );

    try {
      await fetch(`${API_BASE}/api/appointments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: newDate,
          time: time12,
        }),
      });
    } catch (err) {
      console.error(err);
    }
  }

  // ================= FILTER =================

  const filtered = useMemo(() => {
    return [...appointments]
      .filter((a) =>
        search
          ? a.patient
            .toLowerCase()
            .includes(search.toLowerCase())
          : true,
      )
      .filter((a) =>
        statusFilter ? a.status === statusFilter : true,
      )
      .sort(
        (a, b) =>
          parseDateTime(b.date, b.time) -
          parseDateTime(a.date, a.time),
      );
  }, [appointments, search, statusFilter]);

  // ================= UI =================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">
              Appointments
            </h1>

            <p className="text-slate-500 mt-2">
              Manage doctor appointments easily
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchAppointments}
              className="
                inline-flex items-center gap-2
                px-5 py-3 rounded-2xl
                bg-white border border-slate-200
                shadow-sm text-slate-700 font-semibold
                hover:text-emerald-600
                hover:border-emerald-300
                hover:shadow-lg
                hover:-translate-y-0.5
                transition-all duration-300
              "
            >
              <RefreshCw size={18} />
              Refresh
            </button>

            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 text-white shadow-lg">
              <Users size={18} />
              {appointments.length} Total
            </div>
          </div>
        </div>

        {/* SEARCH */}

        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-5 shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row gap-4">

            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search patient..."
                className="
                  w-full pl-11 pr-10 py-3
                  rounded-2xl border border-slate-200
                  bg-white outline-none
                  focus:border-emerald-400
                  transition-all duration-300
                "
              />

              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              className="
                px-5 py-3 rounded-2xl
                border border-slate-200 bg-white
                outline-none
                focus:border-emerald-400
              "
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="complete">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rescheduled">Rescheduled</option>
            </select>
          </div>
        </div>

        {/* CONTENT */}

        {loading ? (
          <div className="text-center py-20 text-slate-500 text-lg font-semibold">
            Loading appointments...
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-3xl p-6 text-center font-semibold">
            {error}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((a) => (
              <div
                key={a.id}
                className="
                  group bg-white/90 backdrop-blur-xl
                  border border-slate-200
                  rounded-3xl p-6
                  shadow-sm hover:shadow-2xl
                  hover:-translate-y-1
                  transition-all duration-300
                "
              >
                {/* TOP */}

                <div className="flex items-start gap-4 mb-5">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center">
                    {a.doctorImage ? (
                      <img
                        src={a.doctorImage}
                        alt={a.doctorName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-bold text-slate-500">
                        {a.doctorName?.charAt(0)}
                      </span>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900">
                      {a.patient}
                    </h3>

                    <p className="text-sm text-slate-500">
                      {a.age} yrs • {a.gender}
                    </p>

                    <p className="mt-1 font-semibold text-emerald-600">
                      {a.doctorName}
                    </p>

                    <p className="text-sm text-slate-500">
                      {a.speciality}
                    </p>
                  </div>
                </div>

                {/* DATE */}

                <div className="flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-3 mb-4">
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <Calendar size={17} />
                    {formatDate(a.date)}
                  </div>

                  <div className="text-sm font-semibold text-emerald-600">
                    {formatTimeAMPM(a.time)}
                  </div>
                </div>

                {/* PHONE */}

                <div className="flex items-center gap-2 text-slate-600 mb-5">
                  <Phone size={16} />
                  <span>{a.mobile}</span>
                </div>

                {/* FOOTER */}

                <div className="flex items-center justify-between mb-4">
                  <div className="text-2xl font-black text-slate-900">
                    ₹{a.fee}
                  </div>

                  <StatusBadge status={a.status} />
                </div>

                <div className="space-y-4">
                  <StatusSelect
                    appointment={a}
                    onChange={(s) =>
                      updateStatusRemote(a.id, s)
                    }
                  />

                  <RescheduleButton
                    appointment={a}
                    onReschedule={(d, t) =>
                      rescheduleRemote(a.id, d, t)
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListPage;