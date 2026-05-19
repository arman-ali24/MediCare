import React, { useEffect, useMemo, useState } from "react";
import { serviceAppointmentsStyles } from "../assets/dummyStyles";
import { Loader2, SearchIcon, XIcon, User, Phone, BadgeIndianRupee, Calendar, Clock, CheckCircle, XCircle } from "lucide-react";

const API_BASE = "https://medicare-backend-t2oa.onrender.com";
// HELPER FUNCTIONS

function formatTwo(n) {
  return String(n).padStart(2, "0");
}
function formatDateNice(dateStr) {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function parseTimeToParts(timeStr) {
  if (!timeStr) return { hour: 12, minute: 0, ampm: "AM" };
  const m = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (m) {
    let hh = Number(m[1]);
    const mm = Number(m[2]);
    const ampm = m[3] ? m[3].toUpperCase() : null;
    if (!ampm) {
      const hour12 = hh % 12 === 0 ? 12 : hh % 12;
      return { hour: hour12, minute: mm, ampm: hh >= 12 ? "PM" : "AM" };
    }
    return { hour: hh, minute: mm, ampm };
  }
  return { hour: 12, minute: 0, ampm: "AM" };
} // For time am/pm

function timePartsTo12HourString(hh24, mm) {
  let ampm = hh24 >= 12 ? "PM" : "AM";
  let hour = hh24 % 12 === 0 ? 12 : hh24 % 12;
  return `${formatTwo(hour)}:${formatTwo(mm)} ${ampm}`;
}

function timePartsToInputValue(a) {
  const hour = Number(a.hour || 0);
  const minute = Number(a.minute || 0);
  let hh24 = hour % 12;
  if ((a.ampm || "AM").toUpperCase() === "PM") hh24 += 12;
  if (a.ampm === "AM" && hour === 12) hh24 = 0;
  if (a.ampm === "PM" && hour === 12) hh24 = 12;
  return `${formatTwo(hh24)}:${formatTwo(minute)}`;
}

// How to display
function formatTimeDisplay(a) {
  return `${formatTwo(a.hour)}:${formatTwo(a.minute)} ${a.ampm}`;
}

// Small component for statusBadge
function StatusBadge({ status }) {
  const classes = serviceAppointmentsStyles.statusBadge(status);
  return (
    <span className={classes}>
      {status === "Confirmed" && <CheckCircle className="h-4 w-4" />}
      {status === "Canceled" && <XCircle className="h-4 w-4" />}
      {status}
    </span>
  );
}

// For toast
function Toast({ toasts, removeToast }) {
  return (
    <div className={serviceAppointmentsStyles.toastContainer}>
      {toasts.map((t) => (
        <div key={t.id} className={serviceAppointmentsStyles.toast}>
          <div className={serviceAppointmentsStyles.toastContent}>
            <div className="mt-0.5">
              <Loader2 className={serviceAppointmentsStyles.toastSpinner} />
            </div>
            <div className={serviceAppointmentsStyles.toastText}>
              <div className={serviceAppointmentsStyles.toastTitle}>
                {t.title}
              </div>
              <div className={serviceAppointmentsStyles.toastMessage}>
                {t.message}
              </div>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className={serviceAppointmentsStyles.toastCloseButton}
              aria-label="close toast"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// For status select small component
function StatusSelect({ appointment, onChange, disabled }) {
  const terminal =
    appointment.status === "Completed" || appointment.status === "Canceled";

  const options = [
    { value: "Pending", label: "Pending" },
    { value: "Confirmed", label: "Confirmed" },
    { value: "Completed", label: "Completed" },
    { value: "Canceled", label: "Canceled" },
  ];

  return (
    <select
      value={appointment.status}
      onChange={(e) => onChange(e.target.value)}
      disabled={terminal || disabled}
      className={serviceAppointmentsStyles.statusSelect(terminal)}
      title={terminal ? "Status cannot be changed" : "Change status"}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// To get todays date ex-YYYY-MM-DD
function getTodayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
// To check previous date comes first that is upcoming date comes first
function isDateBefore(aDateStr, bDateStr) {
  try {
    const a = new Date(`${aDateStr}T00:00:00`);
    const b = new Date(`${bDateStr}T00:00:00`);
    return a.getTime() < b.getTime();
  } catch {
    return false;
  }
}

// For reschedule
function RescheduleButton({ appointment, onReschedule, disabled }) {
  const terminal =
    appointment.status === "Completed" || appointment.status === "Canceled";
  const [editing, setEditing] = useState(false);
  const todayISO = getTodayISO();
  const [date, setDate] = useState(appointment.date || todayISO);
  const [time, setTime] = useState(timePartsToInputValue(appointment));

  useEffect(() => {
    const baseDate = appointment.date || "";
    const initialDate =
      baseDate && !isDateBefore(baseDate, todayISO) ? baseDate : todayISO;
    setDate(initialDate);
    setTime(timePartsToInputValue(appointment));
  }, [
    appointment.date,
    appointment.hour,
    appointment.minute,
    appointment.ampm,
  ]);

  // To save after editing
  function save() {
    if (!date || !time) return;
    if (isDateBefore(date, getTodayISO())) {
      alert("Please choose today or a future date for rescheduling.");
      return;
    }
    onReschedule(date, time);
    setEditing(false);
  }
  // To cancel a booking
  function cancel() {
    const baseDate = appointment.date || "";
    const restoreDate =
      baseDate && !isDateBefore(baseDate, getTodayISO())
        ? baseDate
        : getTodayISO();
    setDate(restoreDate);
    setTime(timePartsToInputValue(appointment));
    setEditing(false);
  }

  return (
    <div className="w-full">
      {!editing ? (
        <div className="flex justify-end">
          <button
            onClick={() => setEditing(true)}
            disabled={terminal || disabled}
            title={
              terminal ? "Cannot reschedule completed/canceled" : "Reschedule"
            }
            className={serviceAppointmentsStyles.rescheduleButton(terminal)}
          >
            Reschedule
          </button>
        </div>
      ) : (
        <div className={serviceAppointmentsStyles.rescheduleEditContainer}>
          <input
            type="date"
            value={date}
            min={getTodayISO()}
            onChange={(e) => setDate(e.target.value)}
            className={serviceAppointmentsStyles.rescheduleDateInput}
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={serviceAppointmentsStyles.rescheduleTimeInput}
          />
          <div className={serviceAppointmentsStyles.rescheduleActions}>
            <button
              onClick={save}
              className={serviceAppointmentsStyles.rescheduleSaveButton}
            >
              Save
            </button>
            <button
              onClick={cancel}
              className={serviceAppointmentsStyles.rescheduleCancelButton}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const ServiceAppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search & debounce
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 220);
    return () => clearTimeout(t);
  }, [search]);

  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchAppointments();
  }, []);

  function pushToast(title, message) {
    const toastId = Date.now() + Math.random();
    setToasts((t) => [...t, { id: toastId, title, message }]);
  }
  function removeToast(id) {
    setToasts((t) => t.filter((x) => x.id !== id));
  }

  async function fetchAppointments() {
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE}/api/service-appointments?limit=500`;
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body?.message || `Failed to fetch appointments (${res.status})`,
        );
      }
      const body = await res.json();
      const list = Array.isArray(body.appointments)
        ? body.appointments
        : (body.appointments ??
          body.items ??
          body.data ??
          body.appointments ??
          []);

      const normalized = (Array.isArray(list) ? list : [])
        .map((a) => {
          const timeStr =
            a.time ||
              (a.slot && a.slot.time) ||
              (a.hour !== undefined && a.minute !== undefined)
              ? `${formatTwo(a.hour || 12)}:${formatTwo(a.minute ?? 0)} ${a.ampm || "AM"
              }`
              : a.rescheduledTo?.time ||
              (a.slot && a.slot.time) ||
              a.time ||
              "";
          const parsed = parseTimeToParts(timeStr);
          return {
            id: a._id || a.id,
            patientName:
              a.patientName ||
              a.name ||
              (a.raw && a.raw.patientName) ||
              "Unknown",
            gender: a.gender || (a.raw && a.raw.gender) || "",
            mobile: a.mobile || a.phone || "",
            age: a.age || a.raw?.age || "",
            serviceName:
              a.serviceName ||
              a.service ||
              a.raw?.serviceName ||
              (a.notes || "").slice(0, 40),
            fees: a.fees ?? a.fee ?? a.payment?.amount ?? 0,
            date:
              a.date || (a.slot && a.slot.date) || a.rescheduledTo?.date || "",
            hour: parsed.hour,
            minute: parsed.minute,
            ampm: parsed.ampm,
            status: a.status || (a.payment && a.payment.status) || "Pending",
            raw: a,
          };
        })
        .filter(Boolean);
      setAppointments(normalized);
    } catch (err) {
      console.error("fetchAppointments:", err);
      setError(err.message || "Failed to load appointments");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) =>
      setTimeout(() => {
        setToasts((s) => s.filter((x) => x.id !== t.id));
      }, 3000),
    );
    return () => timers.forEach((t) => clearTimeout(t));
  }, [toasts]);

  function extractUpdated(body) {
    return body?.data || body?.appointment || body || {};
  }

  // To update the status
  async function changeStatusRemote(id, newStatus) {
    const old = appointments.find((a) => a.id === id);
    if (!old) return;
    if (old.status === "Completed" || old.status === "Canceled") {
      pushToast(
        "Cannot change status",
        `Appointment #${id} is already ${old.status}.`,
      );
      return;
    }

    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)),
    );
    pushToast("Updating status", `Appointment #${id} → ${newStatus}`);

    try {
      const res = await fetch(`${API_BASE}/api/service-appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body?.message || `Status update failed (${res.status})`,
        );
      }
      const body = await res.json();
      const updated = extractUpdated(body);

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
              ...a,
              status: updated.status || newStatus,
              date: updated.date || updated.rescheduledTo?.date || a.date,
              hour: parseTimeToParts(
                updated.time ||
                updated.rescheduledTo?.time ||
                a.raw?.time ||
                `${formatTwo(a.hour)}:${formatTwo(a.minute)} ${a.ampm}`,
              ).hour,
              minute: parseTimeToParts(
                updated.time ||
                updated.rescheduledTo?.time ||
                a.raw?.time ||
                `${formatTwo(a.hour)}:${formatTwo(a.minute)} ${a.ampm}`,
              ).minute,
              ampm: parseTimeToParts(
                updated.time ||
                updated.rescheduledTo?.time ||
                a.raw?.time ||
                `${formatTwo(a.hour)}:${formatTwo(a.minute)} ${a.ampm}`,
              ).ampm,
              raw: updated || a.raw,
            }
            : a,
        ),
      );
      pushToast("Status updated", `Appointment #${id} is now ${newStatus}`);
    } catch (err) {
      console.error("changeStatusRemote:", err);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: old.status } : a)),
      );
      pushToast("Update failed", err.message || "Failed to update status");
    }
  }

  // To reschedule the appointment for later but not on previous days
  async function rescheduleRemote(id, dateStr, time24) {
    const appt = appointments.find((a) => a.id === id);
    if (!appt) return;
    const [hh, mm] = time24.split(":").map(Number);
    const hour12 = hh % 12 === 0 ? 12 : hh % 12;
    const ampm = hh >= 12 ? "PM" : "AM";
    const timeStr = `${formatTwo(hour12)}:${formatTwo(mm)} ${ampm}`;

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
            ...a,
            date: dateStr,
            hour: hour12,
            minute: mm,
            ampm,
            status: "Rescheduled",
          }
          : a,
      ),
    );

    pushToast(
      "Rescheduling",
      `Appointment #${id} → ${formatDateNice(dateStr)} ${timeStr}`,
    );

    try {
      const res = await fetch(`${API_BASE}/api/service-appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rescheduledTo: { date: dateStr, time: timeStr },
          status: "Rescheduled",
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || `Reschedule failed (${res.status})`);
      }
      const body = await res.json();
      const updated = extractUpdated(body);

      const finalDate =
        updated.date || updated.rescheduledTo?.date || dateStr || appt.date;
      const finalTimeStr =
        updated.time ||
        updated.rescheduledTo?.time ||
        timeStr ||
        `${formatTwo(appt.hour)}:${formatTwo(appt.minute)} ${appt.ampm}`;

      const parsed = parseTimeToParts(finalTimeStr);

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
              ...a,
              date: finalDate,
              hour: parsed.hour,
              minute: parsed.minute,
              ampm: parsed.ampm,
              status: updated.status || "Rescheduled",
              raw: updated || a.raw,
            }
            : a,
        ),
      );
      pushToast(
        "Rescheduled",
        `Appointment #${id} moved to ${formatDateNice(
          finalDate,
        )} ${finalTimeStr}`,
      );
    } catch (err) {
      console.error("rescheduleRemote:", err);
      pushToast(
        "Reschedule failed",
        err.message || "Failed to reschedule — reloading",
      );
      await fetchAppointments();
    }
  }

  // To cancel any appt
  async function cancelRemote(id) {
    const appt = appointments.find((a) => a.id === id);
    if (!appt) return;
    if (appt.status === "Canceled") return;
    if (
      !window.confirm(
        `Mark appointment for ${appt.patientName} on ${formatDateNice(
          appt.date,
        )} as CANCELED?`,
      )
    )
      return;

    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "Canceled" } : a)),
    );
    pushToast("Canceling", `Appointment #${id} is being canceled`);

    try {
      const res = await fetch(
        `${API_BASE}/api/service-appointments/${id}/cancel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || `Cancel failed (${res.status})`);
      }
      const body = await res.json();
      const updated = extractUpdated(body);
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
              ...a,
              status: updated.status || "Canceled",
              raw: updated || a.raw,
            }
            : a,
        ),
      );
      pushToast("Canceled", `Appointment #${id} canceled`);
    } catch (err) {
      console.error("cancelRemote:", err);
      pushToast("Cancel failed", err.message || "Failed to cancel — reloading");
      await fetchAppointments();
    }
  }

  // To filter
  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return appointments
      .filter((a) =>
        q
          ? (a.patientName || "").toLowerCase().includes(q) ||
          (a.serviceName || "").toLowerCase().includes(q)
          : true,
      )
      .filter((a) => (statusFilter ? a.status === statusFilter : true));
  }, [appointments, debouncedSearch, statusFilter]);

  // To get time stamp for
  function getTimestamp(a) {
    try {
      const [y, m, d] = (a.date || "1970-01-01").split("-").map(Number);
      let hour = Number(a.hour) || 0;
      if ((a.ampm || "AM") === "PM" && hour !== 12) hour += 12;
      if ((a.ampm || "AM") === "AM" && hour === 12) hour = 0;
      const minute = Number(a.minute) || 0;
      return new Date(y, (m || 1) - 1, d || 1, hour, minute).getTime();
    } catch {
      return 0;
    }
  }
  // Sort that is upcoming date comes first
  const displayList = useMemo(() => {
    const copy = filtered.slice();
    copy.sort((x, y) => getTimestamp(y) - getTimestamp(x));
    return copy;
  }, [filtered]);
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-7xl mx-auto">
        {/* HERO HEADER */}
        <div className="relative overflow-hidden rounded-[2rem] border border-emerald-100 bg-white/80 backdrop-blur-xl shadow-xl p-6 sm:p-8 mb-8">
          <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-100 rounded-full blur-3xl opacity-40" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold mb-4">
                <Calendar size={16} />
                Service Appointments
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-slate-800 leading-tight">
                Manage Patient
                <span className="block bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                  Bookings Efficiently
                </span>
              </h1>

              <p className="mt-4 text-slate-600 max-w-2xl text-sm sm:text-base leading-relaxed">
                Search appointments, update statuses, reschedule bookings and
                manage patient visits with a premium admin dashboard experience.
              </p>
            </div>

            <div className="hidden lg:flex items-center justify-center">
              <div className="w-44 h-44 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center shadow-2xl">
                <Calendar className="text-white" size={80} />
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH + FILTER */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-[2rem] shadow-xl p-5 sm:p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-5 justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by patient or service..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-12 py-3 text-sm font-medium outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />

                {search ? (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition"
                  >
                    <XIcon className="w-5 h-5" />
                  </button>
                ) : null}
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-medium outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Rescheduled">Rescheduled</option>
                <option value="Completed">Completed</option>
                <option value="Canceled">Canceled</option>
              </select>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="text-sm font-semibold text-slate-500">
                {displayList.length} result
                {displayList.length !== 1 ? "s" : ""}
              </div>

              <button
                onClick={fetchAppointments}
                className="rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-5 py-3 font-semibold shadow-lg hover:scale-105 transition-all duration-300"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-[2rem] shadow-xl p-16 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-emerald-500 w-10 h-10 mb-4" />
            <p className="text-slate-600 font-semibold">
              Loading appointments...
            </p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-[2rem] p-8 text-center font-semibold shadow-lg">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {displayList.length === 0 ? (
              <div className="col-span-full bg-white/80 backdrop-blur-xl border border-slate-200 rounded-[2rem] shadow-xl p-16 text-center">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-5">
                  <SearchIcon className="w-10 h-10 text-slate-400" />
                </div>

                <h3 className="text-2xl font-black text-slate-800">
                  No Appointments Found
                </h3>

                <p className="text-slate-500 mt-2">
                  Try another patient name or service.
                </p>
              </div>
            ) : (
              displayList.map((a) => {
                const isLocked =
                  a.status === "Completed" || a.status === "Canceled";

                return (
                  <article
                    key={a.id}
                    className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-500"
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-gradient-to-r from-emerald-50/40 to-cyan-50/40" />

                    <div className="relative z-10 p-6">
                      {/* TOP */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center shadow-lg">
                            <User className="text-white w-8 h-8" />
                          </div>

                          <div>
                            <h3 className="text-xl font-black text-slate-800">
                              {a.patientName}
                            </h3>

                            <p className="text-slate-500 text-sm font-medium">
                              {a.gender} • {a.age} years
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-start sm:items-end gap-3">
                          <StatusBadge status={a.status} />

                          <StatusSelect
                            appointment={a}
                            onChange={(s) => changeStatusRemote(a.id, s)}
                            disabled={false}
                          />
                        </div>
                      </div>

                      {/* DETAILS */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                          <div className="flex items-center gap-3">
                            <Phone className="w-5 h-5 text-emerald-500" />

                            <div>
                              <div className="text-xs text-slate-400 font-semibold uppercase">
                                Phone
                              </div>

                              <div className="font-bold text-slate-700">
                                {a.mobile}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                          <div className="flex items-center gap-3">
                            <BadgeIndianRupee className="w-5 h-5 text-emerald-500" />

                            <div>
                              <div className="text-xs text-slate-400 font-semibold uppercase">
                                Fees
                              </div>

                              <div className="font-bold text-slate-700">
                                ₹{a.fees}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-cyan-500" />

                            <div>
                              <div className="text-xs text-slate-400 font-semibold uppercase">
                                Appointment Date
                              </div>

                              <div className="font-bold text-slate-700">
                                {formatDateNice(a.date)}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                          <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-cyan-500" />

                            <div>
                              <div className="text-xs text-slate-400 font-semibold uppercase">
                                Appointment Time
                              </div>

                              <div className="font-bold text-slate-700">
                                {formatTimeDisplay(a)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* SERVICE */}
                      <div className="mt-6 rounded-2xl bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-100 p-5">
                        <div className="text-xs text-slate-400 font-semibold uppercase mb-1">
                          Booked Service
                        </div>

                        <div className="text-lg font-black text-slate-800">
                          {a.serviceName}
                        </div>
                      </div>

                      {/* ACTIONS */}
                      <div className="flex flex-col sm:flex-row gap-4 mt-8">
                        <div className="flex-1">
                          <RescheduleButton
                            appointment={a}
                            onReschedule={(d, t) =>
                              rescheduleRemote(a.id, d, t)
                            }
                            disabled={false}
                          />
                        </div>

                        <button
                          onClick={() => cancelRemote(a.id)}
                          disabled={isLocked}
                          className={`px-6 py-3 rounded-2xl font-bold transition-all duration-300 ${isLocked
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                              : "bg-red-500 hover:bg-red-600 text-white shadow-lg hover:scale-105"
                            }`}
                        >
                          Cancel Appointment
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}

        {/* LEGEND */}
        <div className="mt-8 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-[2rem] shadow-xl p-5">
          <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              Pending
            </div>

            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              Confirmed
            </div>

            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              Canceled
            </div>

            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <div className="w-3 h-3 rounded-full bg-sky-400" />
              Completed
            </div>

            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <div className="w-3 h-3 rounded-full bg-indigo-400" />
              Rescheduled
            </div>
          </div>
        </div>

        {/* TOAST */}
        <Toast toasts={toasts} removeToast={removeToast} />
      </div>
    </div>
  );
};

export default ServiceAppointmentsPage;
