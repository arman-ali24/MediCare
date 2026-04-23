import React, { useEffect, useMemo, useState } from "react";
import {
  pageStyles,
  statusClasses,
  keyframesStyles,
} from "../assets/dummyStyles";

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
        const url = `${API_BASE}/api/appointments?limit=200${
          q ? `&search=${encodeURIComponent(q)}` : ""
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
      `As admin, mark appointment for ${appt.patientName} with ${
        appt.doctorName
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
    <div>
      
    </div>
  );
};

export default AppointmentsPage;
