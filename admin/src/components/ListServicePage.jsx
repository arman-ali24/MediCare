import React, { useState, useRef, useEffect } from "react";
import {
  Image as ImageIcon,
  Edit2,
  Trash2,
  Check,
  X,
  ChevronDown,
  Search,
  Calendar,
  Plus,
} from "lucide-react";
import { serviceListStyles as s } from "../assets/dummyStyles";

export default function ListServicePage() {
  const API_BASE = "http://localhost:4000";

  const [services, setServices] = useState([]);
  const [openDetails, setOpenDetails] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState("all");
  const [editForm, setEditForm] = useState(null);
  const fileRef = useRef();

  // Toasts
  const [toasts, setToasts] = useState([]);
  function addToast(
    message,
    type = "success",
    ttl = 3000,
    position = "bottom-right",
    animated = false,
  ) {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type, position, animated }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ttl);
  }

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const todayISO = (() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  })();

  // Sort the slots as latest come first by date
  function sortSlotsForDisplay(slots = []) {
    if (!Array.isArray(slots)) return [];

    const today = new Date();
    const todayVal = Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    const dateOnlyVal = (dateStr) => {
      if (!dateStr || typeof dateStr !== "string")
        return Number.POSITIVE_INFINITY;
      const parts = dateStr.split("-");
      if (parts.length !== 3) return Number.POSITIVE_INFINITY;
      const y = Number(parts[0]),
        m = Number(parts[1]) - 1,
        d = Number(parts[2]);
      if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d))
        return Number.POSITIVE_INFINITY;
      return Date.UTC(y, m, d);
    };
    const arr = slots.slice();

    arr.sort((a, b) => {
      const aDateVal = dateOnlyVal(a.date);
      const bDateVal = dateOnlyVal(b.date);

      const aIsPast = aDateVal < todayVal;
      const bIsPast = bDateVal < todayVal;
      if (aIsPast !== bIsPast) return aIsPast ? -1 : 1;

      if (aIsPast && bIsPast && aDateVal !== bDateVal) {
        return bDateVal - aDateVal;
      }
      if (!aIsPast && !bIsPast && aDateVal !== bDateVal) {
        return aDateVal - bDateVal;
      }

      const aTs = slotDateTimeToMs(a) || Number.POSITIVE_INFINITY;
      const bTs = slotDateTimeToMs(b) || Number.POSITIVE_INFINITY;
      return aTs - bTs;
    });

    return arr;
  }

  // To fetch service from the server
  async function fetchServices() {
    try {
      const res = await fetch(`${API_BASE}/api/services`);
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        console.error("Failed to fetch services", body);
        addToast("Failed to load services", "error");
        setServices([]);
        return;
      }
      const items = (body && (body.data || body.services || body.items)) || [];
      const normalized = items.map((s) => ({
        id: s._id || s.id,
        name: s.name,
        about: s.about || "",
        instructions: s.instructions || s.preInstructions || [],
        instructionsText: (s.instructions || s.preInstructions || []).join(
          "\n",
        ),
        price: s.price ?? s.fee ?? 0,
        available: s.available ?? s.availability === "Available",
        image: s.image || s.imageUrl || s.imageSrc || s.imageSmall || "",

        slots: Array.isArray(s.slots)
          ? convertSlotsForUI(s.slots)
          : s.slots && typeof s.slots === "object"
            ? convertSlotsMapToArray(s.slots)
            : [],
        _raw: s,
      }));
      setServices(normalized);
    } catch (err) {
      console.error("fetchServices error", err);
      addToast("Network error while loading services", "error");
      setServices([]);
    }
  }

  useEffect(() => {
    fetchServices();
  }, []);

  // Convert array of slots into slot object
  function convertSlotsForUI(slotStrings = []) {
    return (slotStrings || []).map((s, idx) => {
      const raw = String(s || "");
      const m = raw.match(
        /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})\s*•\s*(\d{1,2}):(\d{2})\s*(AM|PM)?/i,
      );
      if (m) {
        const day = m[1].padStart(2, "0");
        const monthShort = m[2];
        const year = m[3];
        const hour = String(Number(m[4])); // 1-12
        const minute = String(m[5]).padStart(2, "0");
        const ampm = (m[6] || "AM").toUpperCase();
        const mi = months.findIndex(
          (mm) => mm.toLowerCase() === monthShort.toLowerCase(),
        );
        const monthNum = mi >= 0 ? String(mi + 1).padStart(2, "0") : "01";
        const date = `${year}-${monthNum}-${day}`;
        return { id: `s-${idx}`, date, hour, minute, ampm, raw };
      }

      const isoMatch = raw.match(
        /^(\d{4}-\d{2}-\d{2})(?:[T\s](\d{2}):(\d{2})(?::\d{2})?(?:\.\d+)?(?:Z|[+\-]\d{2}:\d{2})?)?/,
      );
      if (isoMatch) {
        const datePart = isoMatch[1];
        let hour = "10";
        let minute = "00";
        let ampm = "AM";
        if (isoMatch[2]) {
          const hh = Number(isoMatch[2]);
          const mm = String(Number(isoMatch[3] || "0")).padStart(2, "0");
          minute = mm;
          if (hh === 0) {
            hour = "12";
            ampm = "AM";
          } else if (hh === 12) {
            hour = "12";
            ampm = "PM";
          } else if (hh > 12) {
            hour = String(hh - 12);
            ampm = "PM";
          } else {
            hour = String(hh);
            ampm = "AM";
          }
        }
        return { id: `s-${idx}`, date: datePart, hour, minute, ampm, raw };
      }

      const timeOnly = raw.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (timeOnly) {
        const hour = String(Number(timeOnly[1]));
        const minute = String(timeOnly[2]).padStart(2, "0");
        const ampm = (timeOnly[3] || "AM").toUpperCase();
        return {
          id: `s-${idx}`,
          date: "",
          hour,
          minute,
          ampm,
          raw,
        };
      }

      // For slot we req date, time
      return {
        id: `s-${idx}`,
        date: "",
        hour: "10",
        minute: "00",
        ampm: "AM",
        raw,
      };
    });
  }

  // Convert map-like slots to array slots of object
  function convertSlotsMapToArray(slotsMap) {
    try {
      const out = [];
      if (slotsMap instanceof Map) {
        for (const [date, arr] of slotsMap.entries()) {
          (arr || []).forEach((t, idx) => {
            const parsed = parseFrontendSlotString(date, t);
            out.push({ id: `${date}-${idx}`, ...parsed, raw: t });
          });
        }
      } else {
        for (const date of Object.keys(slotsMap || {})) {
          (slotsMap[date] || []).forEach((t, idx) => {
            const parsed = parseFrontendSlotString(date, t);
            out.push({ id: `${date}-${idx}`, ...parsed, raw: t });
          });
        }
      }
      return out;
    } catch (e) {
      return [];
    }
  }

  // Gives output with date and time like DD-MM-YYYY with HH:MM AM/PM
  function parseFrontendSlotString(date, timeStr) {
    const slot = {
      date: date || "",
      hour: "10",
      minute: "00",
      ampm: "AM",
      raw: timeStr,
    };

    if (!timeStr) return slot;
    const raw = String(timeStr);

    const isoMatch = raw.match(
      /[T\s](\d{2}):(\d{2})(?::\d{2})?(?:\.\d+)?(?:Z|[+\-]\d{2}:\d{2})?$/,
    );
    if (isoMatch) {
      const hh24 = Number(isoMatch[1]);
      const mm = String(Number(isoMatch[2])).padStart(2, "0");
      if (hh24 === 0) {
        slot.hour = "12";
        slot.ampm = "AM";
      } else if (hh24 === 12) {
        slot.hour = "12";
        slot.ampm = "PM";
      } else if (hh24 > 12) {
        slot.hour = String(hh24 - 12);
        slot.ampm = "PM";
      } else {
        slot.hour = String(hh24);
        slot.ampm = "AM";
      }
      slot.minute = mm;
      return slot;
    }

    const m = raw.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (m) {
      slot.hour = String(Number(m[1]));
      slot.minute = String(m[2]).padStart(2, "0");
      slot.ampm = (m[3] || "AM").toUpperCase();
    }
    return slot;
  }

  function toggleDetails(id) {
    setOpenDetails((prev) => ({ [id]: !prev[id] }));
  } // To toggle

  // To edit any service
  async function startEdit(service) {
    let latest = service;
    if (service.id) {
      try {
        const res = await fetch(`${API_BASE}/api/services/${service.id}`);
        const body = await res.json().catch(() => null);
        if (res.ok && body) {
          latest = body.data || body.service || body;
        }
      } catch (e) { }
    }

    const normalized = {
      id: latest._id || latest.id,
      name: latest.name || "",
      about: latest.about || "",
      instructionsText: (
        latest.instructions ||
        latest.preInstructions ||
        []
      ).join("\n"),
      price: latest.price ?? latest.fee ?? 0,
      available:
        latest.available ?? latest.availability === "Available" ?? true,
      imagePreview: latest.imageUrl || latest.image || latest.imageSrc || "",
      imageFile: null,
      slots: sortSlotsForDisplay(
        Array.isArray(latest.slots)
          ? convertSlotsForUI(latest.slots)
          : convertSlotsMapToArray(latest.slots),
      ),
    };

    setEditingId(normalized.id);
    setEditForm(normalized);
    setOpenDetails({ [normalized.id]: true });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
  }

  // To validate the slot is not previous days or time
  function validateSlots(slots = []) {
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (!slot) {
        return {
          valid: false,
          message: "Please fill all slot date/time fields.",
        };
      }
      if (!slot.date || !/^\d{4}-\d{2}-\d{2}$/.test(slot.date)) {
        return {
          valid: false,
          message:
            "Please provide a valid date (year-month-day) for all slots. Example: 2025-12-31.",
        };
      }
      if (!slot.hour || !/^(?:[1-9]|1[0-2])$/.test(String(slot.hour))) {
        return {
          valid: false,
          message: "Please select hour (1-12) for all slots.",
        };
      }
      if (!slot.minute || !/^\d{2}$/.test(String(slot.minute))) {
        return {
          valid: false,
          message: "Please select minute (00-59) for all slots.",
        };
      }
      const mm = Number(slot.minute);
      if (isNaN(mm) || mm < 0 || mm > 59) {
        return {
          valid: false,
          message: "Please select a valid minute (00-59) for all slots.",
        };
      }
      if (!slot.ampm || (slot.ampm !== "AM" && slot.ampm !== "PM")) {
        return {
          valid: false,
          message: "Please select AM or PM for all slots.",
        };
      }
      const slotTs = slotDateTimeToMs(slot);
      if (slotTs <= Date.now()) {
        return {
          valid: false,
          message:
            "One or more slots are in the past. Please pick future date/time for all slots.",
        };
      }
    }
    return { valid: true };
  }

  // To prevent from duplicate slots to be present
  function findDuplicateInSlots(slots = []) {
    const seen = new Set();
    for (let s of slots) {
      const key = `${s.date}|${s.hour}|${String(s.minute).padStart(2, "0")}|${s.ampm
        }`;
      if (seen.has(key)) return key;
      seen.add(key);
    }
    return null;
  }

  // Formate the slot for backend
  function slotsToFormattedStrings(slots = []) {
    return (slots || []).map((s) => {
      if (typeof s === "string") return s;
      if (s.raw && typeof s.raw === "string" && s.raw.includes("•"))
        return s.raw;
      // build formatted string from date/hour/minute/ampm
      const parts = (s.date || "").split("-");
      const year = parts[0] || "";
      const monthNum = Number(parts[1] || "1");
      const day = parts[2] ? String(Number(parts[2])).padStart(2, "0") : "";
      const monthName = months[monthNum - 1] || months[0];
      const hour = String(s.hour || "10").padStart(2, "0");
      const minute = String(s.minute || "00").padStart(2, "0");
      const ampm = (s.ampm || "AM").toUpperCase();
      if (!day || !year) {
        return s.raw || `${hour}:${minute} ${ampm}`;
      }
      return `${day} ${monthName} ${year} • ${hour}:${minute} ${ampm}`;
    });
  }

  // Convert slot obj to timestamp in local timezone
  function slotDateTimeToMs(slot) {
    const [y, m, d] = (slot.date || "").split("-");
    if (!y || !m || !d) return 0;
    let h = Number(slot.hour || 0);
    const mm = Number(slot.minute || 0);
    const ap = (slot.ampm || "AM").toUpperCase();
    if (ap === "AM") {
      if (h === 12) h = 0;
    } else {
      if (h !== 12) h = h + 12;
    }
    return new Date(Number(y), Number(m) - 1, Number(d), h, mm, 0, 0).getTime();
  }

  // To edit any service we save then for a particular service
  async function saveEdit() {
    if (!editForm) return;

    if ((editForm.slots || []).length > 0) {
      const validation = validateSlots(editForm.slots || []);
      if (!validation.valid) {
        addToast(validation.message, "error");
        return;
      }
      const dupKey = findDuplicateInSlots(editForm.slots || []);
      if (dupKey) {
        const [date, hour, minute, ampm] = dupKey.split("|");
        addToast(
          `Duplicate slot detected: ${formatDateHuman(
            date,
          )} — ${hour}:${minute} ${ampm}`,
          "error",
          4000,
          "top-right",
          true,
        );
        return;
      }
    }

    try {
      const fd = new FormData();
      fd.append("name", editForm.name || "");
      fd.append("about", editForm.about || "");
      fd.append("price", String(Number(editForm.price || 0)));
      fd.append(
        "availability",
        editForm.available ? "available" : "unavailable",
      );

      const instructions = (editForm.instructionsText || "")
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      fd.append("instructions", JSON.stringify(instructions));

      const slotsFormatted = slotsToFormattedStrings(editForm.slots || []);
      fd.append("slots", JSON.stringify(slotsFormatted));

      if (editForm.imageFile) {
        fd.append("image", editForm.imageFile);
      }

      const id = editForm.id;
      const res = await fetch(`${API_BASE}/api/services/${id}`, {
        method: "PUT",
        body: fd,
      });
      const body = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("Save failed:", body);
        addToast(body?.message || "Failed to save service", "error");
        return;
      }

      const updatedRaw = body?.data || body?.service || null;

      setServices((list) =>
        list.map((s) =>
          s.id === id
            ? {
              id,
              name: editForm.name,
              about: editForm.about,
              instructions: instructions,
              instructionsText: instructions.join("\n"),
              price: Number(editForm.price) || 0,
              available: !!editForm.available,
              image:
                updatedRaw?.imageUrl ||
                updatedRaw?.image ||
                editForm.imagePreview ||
                s.image,
              slots:
                updatedRaw?.slots && Array.isArray(updatedRaw.slots)
                  ? convertSlotsForUI(updatedRaw.slots)
                  : editForm.slots || s.slots,
              _raw: updatedRaw || s._raw,
            }
            : s,
        ),
      );

      addToast("Service updated successfully", "success");
      cancelEdit();
    } catch (err) {
      console.error("saveEdit error", err);
      addToast("Network error while saving", "error");
    }
  }

  // To delete any service by id
  async function removeService(id) {
    if (!window.confirm("Are you sure you want to remove this service?"))
      return;
    try {
      const res = await fetch(`${API_BASE}/api/services/${id}`, {
        method: "DELETE",
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        console.error("Delete failed", body);
        addToast(body?.message || "Failed to remove service", "error");
        return;
      }
      setServices((s) => s.filter((x) => x.id !== id));
      setOpenDetails({});
      addToast("Service removed", "success");
    } catch (err) {
      console.error("removeService error", err);
      addToast("Network error while removing", "error");
    }
  }

  // For image handling
  function onImageFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (editForm?.imagePreview && editForm.imagePreview.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(editForm.imagePreview);
      } catch (err) { }
    }
    const url = URL.createObjectURL(f);
    setEditForm((prev) => ({ ...prev, imagePreview: url, imageFile: f }));
  }

  // To add new slot
  function addNewSlot() {
    const nextId =
      (editForm.slots?.reduce((a, b) => {
        const idA = Number(String(a.id || "0").replace(/\D/g, "")) || 0;
        const idB = Number(String(b.id || "0").replace(/\D/g, "")) || 0;
        return Math.max(idA, idB);
      }, 0) || 0) + 1;
    const newSlot = {
      id: `s-${nextId}`,
      date: todayISO,
      hour: "10",
      minute: "00",
      ampm: "AM",
    };
    setEditForm((p) => ({ ...p, slots: [...(p.slots || []), newSlot] }));
  }

  // To update any slot
  function updateSlot(slotId, field, value) {
    setEditForm((p) => {
      const oldSlot = (p.slots || []).find((s) => s.id === slotId) || {};
      if (field === "date" && value) {
        if (value < todayISO) {
          addToast(
            "Cannot select a past date. Choose today or a future date.",
            "error",
          );
          return p;
        }
      }

      const newSlots = (p.slots || []).map((s) =>
        s.id === slotId ? { ...s, [field]: value } : s,
      );

      const dupKey = findDuplicateInSlots(newSlots || []);
      if (dupKey) {
        const [date, hour, minute, ampm] = dupKey.split("|");
        addToast(
          `Duplicate slot detected: ${formatDateHuman(
            date,
          )} — ${hour}:${minute} ${ampm}`,
          "error",
          3500,
          "top-right",
          true,
        );
      }

      return { ...p, slots: newSlots };
    });
  }

  // Remove any slot by id
  function removeSlot(slotId) {
    setEditForm((p) => ({
      ...p,
      slots: (p.slots || []).filter((s) => s.id !== slotId),
    }));
  }

  // To filter
  const filtered = services
    .filter((s) => s.name.toLowerCase().includes(search.trim().toLowerCase()))
    .filter((s) => {
      if (filterMode === "all") return true;
      if (filterMode === "available") return s.available === true;
      if (filterMode === "unavailable") return s.available === false;
      return true;
    });

  // Formate date helper
  function formatDateHuman(dateStr) {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    const mi = Number(m) - 1;
    const mon = months[mi] || m;
    return `${String(Number(d))} ${mon} ${y}`;
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
                <Calendar size={16} />
                Service Management
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-slate-800 leading-tight">
                Manage Your
                <span className="block bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                  Healthcare Services
                </span>
              </h1>

              <p className="mt-4 text-slate-600 max-w-2xl text-sm sm:text-base leading-relaxed">
                Edit service details, manage pricing, update availability and
                schedule premium healthcare slots seamlessly.
              </p>
            </div>

            <div className="hidden lg:flex items-center justify-center">
              <div className="w-44 h-44 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center shadow-2xl">
                <Calendar className="text-white" size={80} />
              </div>
            </div>
          </div>
        </div>

        {/* FILTER SECTION */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-[2rem] shadow-xl p-5 sm:p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-5 lg:items-center lg:justify-between">
            {/* FILTER BUTTONS */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setFilterMode("all")}
                className={`px-5 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${filterMode === "all"
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg scale-105"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                type="button"
              >
                All Services
              </button>

              <button
                onClick={() => setFilterMode("available")}
                className={`px-5 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${filterMode === "available"
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg scale-105"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                type="button"
              >
                Available
              </button>

              <button
                onClick={() => setFilterMode("unavailable")}
                className={`px-5 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${filterMode === "unavailable"
                  ? "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg scale-105"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                type="button"
              >
                Unavailable
              </button>
            </div>

            {/* SEARCH */}
            <div className="relative w-full lg:w-[340px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search services..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 py-3 text-sm font-medium outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </div>
          </div>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filtered.map((svc) => {
            const isOpen = !!openDetails[svc.id];
            const isEditing = editingId === svc.id;

            return (
              <div
                key={svc.id}
                className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-[2rem] shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl"
              >
                {/* TOP CARD */}
                <div
                  className="p-5 sm:p-6 cursor-pointer"
                  onClick={() => toggleDetails(svc.id)}
                >
                  <div className="flex gap-5">
                    {/* IMAGE */}
                    <div className="w-28 h-28 rounded-3xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                      {svc.image ? (
                        <img
                          src={svc.image}
                          alt={svc.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <ImageIcon size={40} />
                        </div>
                      )}
                    </div>

                    {/* INFO */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="min-w-0">
                          <h2 className="text-xl font-black text-slate-800 truncate">
                            {svc.name}
                          </h2>

                          <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                            {svc.about}
                          </p>
                        </div>

                        <div className="flex flex-col items-start sm:items-end gap-3">
                          <div className="text-2xl font-black bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                            ₹{svc.price}
                          </div>

                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${svc.available
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                              }`}
                          >
                            {svc.available ? (
                              <>
                                <Check className="w-3 h-3" />
                                Available
                              </>
                            ) : (
                              <>
                                <X className="w-3 h-3" />
                                Unavailable
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* SLOT + CHEVRON */}
                      <div className="mt-5 flex items-center justify-between">
                        <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
                          <Calendar className="w-4 h-4 text-emerald-500" />
                          {svc.slots.length} slot
                          {svc.slots.length !== 1 ? "s" : ""}
                        </div>

                        <ChevronDown
                          className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${isOpen ? "rotate-180" : ""
                            }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* DETAILS */}
                {isOpen && (
                  <div className="border-t border-slate-100 px-5 sm:px-6 py-6 bg-slate-50/70">
                    {isEditing ? (
                      <div className="space-y-6">
                        {/* EDIT TOP */}
                        <div className="flex flex-col lg:flex-row gap-6">
                          {/* IMAGE */}
                          <div className="w-full lg:w-60">
                            <div className="w-full h-60 rounded-3xl overflow-hidden border border-slate-200 bg-white">
                              {editForm?.imagePreview ? (
                                <img
                                  src={editForm.imagePreview}
                                  alt="preview"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                  <ImageIcon size={50} />
                                </div>
                              )}
                            </div>

                            <input
                              ref={fileRef}
                              onChange={onImageFileChange}
                              type="file"
                              accept="image/*"
                              className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                            />
                          </div>

                          {/* INPUTS */}
                          <div className="flex-1 space-y-4">
                            <input
                              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                              value={editForm.name}
                              onChange={(e) =>
                                setEditForm((p) => ({
                                  ...p,
                                  name: e.target.value,
                                }))
                              }
                              placeholder="Service name"
                            />

                            <input
                              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                              value={editForm.price}
                              onChange={(e) =>
                                setEditForm((p) => ({
                                  ...p,
                                  price: e.target.value,
                                }))
                              }
                              type="number"
                              placeholder="Price"
                            />

                            <select
                              value={editForm.available ? "true" : "false"}
                              onChange={(e) =>
                                setEditForm((p) => ({
                                  ...p,
                                  available: e.target.value === "true",
                                }))
                              }
                              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                            >
                              <option value="true">Available</option>
                              <option value="false">Unavailable</option>
                            </select>
                          </div>
                        </div>

                        {/* ABOUT */}
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">
                            About
                          </label>

                          <textarea
                            className="w-full rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                            rows={5}
                            value={editForm.about}
                            onChange={(e) =>
                              setEditForm((p) => ({
                                ...p,
                                about: e.target.value,
                              }))
                            }
                          />
                        </div>

                        {/* INSTRUCTIONS */}
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">
                            Instructions
                          </label>

                          <textarea
                            className="w-full rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                            rows={5}
                            value={editForm.instructionsText}
                            onChange={(e) =>
                              setEditForm((p) => ({
                                ...p,
                                instructionsText: e.target.value,
                              }))
                            }
                          />
                        </div>

                        {/* SLOTS */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <label className="text-sm font-bold text-slate-700">
                              Slots
                            </label>

                            <button
                              onClick={addNewSlot}
                              type="button"
                              className="flex items-center gap-2 rounded-2xl bg-emerald-500 text-white px-4 py-2 text-sm font-bold hover:bg-emerald-600 transition-all"
                            >
                              <Plus className="w-4 h-4" />
                              Add Slot
                            </button>
                          </div>

                          <div className="space-y-4">
                            {(editForm.slots || []).map((slot) => (
                              <div
                                key={slot.id}
                                className="rounded-3xl border border-slate-200 bg-white p-4"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                  <input
                                    type="date"
                                    value={slot.date}
                                    onChange={(e) =>
                                      updateSlot(
                                        slot.id,
                                        "date",
                                        e.target.value,
                                      )
                                    }
                                    required
                                    min={todayISO}
                                    className="rounded-2xl border border-slate-200 px-4 py-3"
                                  />

                                  <select
                                    value={slot.hour}
                                    onChange={(e) =>
                                      updateSlot(
                                        slot.id,
                                        "hour",
                                        e.target.value,
                                      )
                                    }
                                    className="rounded-2xl border border-slate-200 px-4 py-3"
                                  >
                                    {Array.from(
                                      { length: 12 },
                                      (_, i) => i + 1,
                                    ).map((h) => (
                                      <option key={h} value={String(h)}>
                                        {h}
                                      </option>
                                    ))}
                                  </select>

                                  <select
                                    value={slot.minute}
                                    onChange={(e) =>
                                      updateSlot(
                                        slot.id,
                                        "minute",
                                        e.target.value,
                                      )
                                    }
                                    className="rounded-2xl border border-slate-200 px-4 py-3"
                                  >
                                    {Array.from(
                                      { length: 60 },
                                      (_, i) => i,
                                    ).map((m) => (
                                      <option
                                        key={m}
                                        value={String(m).padStart(2, "0")}
                                      >
                                        {String(m).padStart(2, "0")}
                                      </option>
                                    ))}
                                  </select>

                                  <select
                                    value={slot.ampm}
                                    onChange={(e) =>
                                      updateSlot(
                                        slot.id,
                                        "ampm",
                                        e.target.value,
                                      )
                                    }
                                    className="rounded-2xl border border-slate-200 px-4 py-3"
                                  >
                                    <option>AM</option>
                                    <option>PM</option>
                                  </select>

                                  <button
                                    onClick={() => removeSlot(slot.id)}
                                    className="rounded-2xl bg-red-50 text-red-500 font-semibold hover:bg-red-100 transition-all"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="flex justify-end gap-4">
                          <button
                            onClick={cancelEdit}
                            className="px-6 py-3 rounded-2xl border border-slate-200 font-semibold hover:bg-slate-100"
                          >
                            Cancel
                          </button>

                          <button
                            onClick={saveEdit}
                            className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold shadow-lg hover:scale-105 transition-all duration-300"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* ABOUT */}
                        <div>
                          <h3 className="text-lg font-black text-slate-800 mb-3">
                            About Service
                          </h3>

                          <p className="text-sm text-slate-600 leading-relaxed">
                            {svc.about}
                          </p>
                        </div>

                        {/* INSTRUCTIONS */}
                        <div>
                          <h3 className="text-lg font-black text-slate-800 mb-3">
                            Instructions
                          </h3>

                          <ul className="space-y-3">
                            {svc.instructions.map((p, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-3 rounded-2xl bg-white border border-slate-200 px-4 py-3"
                              >
                                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-black shrink-0">
                                  {i + 1}
                                </div>

                                <span className="text-sm text-slate-700">
                                  {p}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* SLOTS */}
                        <div>
                          <h3 className="text-lg font-black text-slate-800 mb-3">
                            Available Slots
                          </h3>

                          {svc.slots.length === 0 ? (
                            <div className="rounded-2xl bg-white border border-slate-200 p-5 text-sm text-slate-500">
                              No slots scheduled
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {sortSlotsForDisplay(svc.slots).map((slot) => (
                                <div
                                  key={slot.id}
                                  className="flex items-center gap-3 rounded-2xl bg-white border border-slate-200 px-4 py-3"
                                >
                                  <Calendar className="w-5 h-5 text-emerald-500" />

                                  <div className="text-sm font-semibold text-slate-700">
                                    {formatDateHuman(slot.date)} — {slot.hour}:
                                    {String(slot.minute).padStart(2, "0")}{" "}
                                    {slot.ampm}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* BUTTONS */}
                        <div className="flex flex-wrap gap-4 pt-2">
                          <button
                            onClick={() => startEdit(svc)}
                            className="flex items-center gap-2 rounded-2xl bg-emerald-50 text-emerald-600 px-5 py-3 font-bold hover:bg-emerald-100 transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit Service
                          </button>

                          <button
                            onClick={() => removeService(svc.id)}
                            className="flex items-center gap-2 rounded-2xl bg-red-50 text-red-500 px-5 py-3 font-bold hover:bg-red-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* EMPTY */}
        {filtered.length === 0 && (
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-[2rem] shadow-xl p-10 text-center text-slate-500 font-semibold mt-6">
            No services match your search.
          </div>
        )}

        {/* TOAST TOP */}
        <div className={s.toastContainerTop}>
          {toasts
            .filter((t) => t.position === "top-right")
            .map((t) => (
              <div
                key={t.id}
                className={`${s.toast} ${t.animated ? s.toastAnimated : ""
                  }`}
              >
                <div
                  className={`${s.toastInner} ${t.type === "success"
                    ? s.toastSuccess
                    : s.toastError
                    }`}
                >
                  <div className={s.toastContent}>
                    <div
                      className={
                        t.type === "success"
                          ? s.toastIconSuccess
                          : s.toastIconError
                      }
                    >
                      <Check className={s.toastIconSvg} />
                    </div>

                    <div className={s.toastMessage}>{t.message}</div>

                    <button
                      onClick={() =>
                        setToasts((s) =>
                          s.filter((x) => x.id !== t.id),
                        )
                      }
                      className={s.toastCloseButton}
                    >
                      <X className={s.toastCloseIcon} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* TOAST BOTTOM */}
        <div className={s.toastContainerBottom}>
          {toasts
            .filter((t) => t.position === "bottom-right")
            .map((t) => (
              <div key={t.id} className={s.toast}>
                <div
                  className={`${s.toastInner} ${t.type === "success"
                    ? s.toastSuccess
                    : s.toastError
                    }`}
                >
                  <div className={s.toastContent}>
                    <div
                      className={
                        t.type === "success"
                          ? s.toastIconSuccess
                          : s.toastIconError
                      }
                    >
                      <Check className={s.toastIconSvg} />
                    </div>

                    <div className={s.toastMessage}>{t.message}</div>

                    <button
                      onClick={() =>
                        setToasts((s) =>
                          s.filter((x) => x.id !== t.id),
                        )
                      }
                      className={s.toastCloseButton}
                    >
                      <X className={s.toastCloseIcon} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
