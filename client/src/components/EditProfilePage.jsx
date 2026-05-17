import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Edit2,
  Save,
  X,
  Plus,
  Calendar,
  Clock,
  Image as ImageIcon,
  Check,
  Trash,
  Star,
  User,
  Briefcase,
  GraduationCap,
  MapPin,
  DollarSign,
  CheckCircle,
  AlertCircle,
  BadgeIndianRupee,
} from "lucide-react";

const STORAGE_KEY = "doctorToken_v1";

// helper functions similar to the dashboard page
function parse12HourTimeToMinutes(t) {
  if (!t) return 0;
  const [time, ampm] = t.split(" ");
  const [hh, mm] = time.split(":");
  let h = Number(hh) % 12;
  if ((ampm || "").toUpperCase() === "PM") h += 12;
  return h * 60 + Number(mm);
}

function formatTimeFromInput(time24) {
  if (!time24) return time24;
  const [h, m] = time24.split(":");
  let hr = Number(h);
  const ampm = hr >= 12 ? "PM" : "AM";
  hr = hr % 12 || 12;
  return `${String(hr).padStart(2, "0")}:${m} ${ampm}`;
}

// this function will prevent from the duplicate slots
function dedupeAndSortSchedule(schedule = {}) {
  const out = {};
  Object.entries(schedule || {}).forEach(([date, slots]) => {
    const uniq = Array.from(new Set(slots || []));
    uniq.sort(
      (a, b) => parse12HourTimeToMinutes(a) - parse12HourTimeToMinutes(b),
    );
    out[date] = uniq;
  });
  return out;
}

export default function EditProfilePage({ apiBase }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const API_BASE = "http://localhost:4000/api/doctors";

  const [doc, setDoc] = useState(null);
  const [editing, setEditing] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [localImageFile, setLocalImageFile] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchDoctor() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Failed to fetch doctor");
        const d = json.data || json || {};
        d.schedule = dedupeAndSortSchedule(d.schedule || {});
        d.imageUrl =
          d.imageUrl || d.image || d.imageUrl === null ? d.imageUrl : d.image;
        if (!cancelled) {
          setDoc(d);
          setImagePreview(d.imageUrl || "");
        }
      } catch (err) {
        console.error("fetchDoctor error:", err);
        addToast("Unable to load profile", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (id) fetchDoctor();
    return () => {
      cancelled = true;
      if (imagePreview && imagePreview.startsWith("blob:"))
        URL.revokeObjectURL(imagePreview);
    };
  }, [id]);

  // to add toast
  const addToast = (text, type = "success") => {
    const idt = Date.now() + Math.random();
    const t = { id: idt, text, type };
    setToasts((prev) => [t, ...prev.slice(0, 2)]);
    setTimeout(
      () => setToasts((prev) => prev.filter((it) => it.id !== idt)),
      3000,
    );
  };

  // to add date and check for duplicate date and prevent it
  const addDate = (dateStr) => {
    if (!dateStr) return;
    if (doc.schedule[dateStr]) {
      addToast("Date already exists", "error");
      return;
    }
    setDoc((d) => ({ ...d, schedule: { ...d.schedule, [dateStr]: [] } }));
    addToast("Date added successfully", "success");
  };

  // same thing prevent duplicate slot and add new slot
  const addSlot = (dateStr, time) => {
    if (!dateStr || !time) return;
    const formatted = formatTimeFromInput(time);
    setDoc((d) => {
      const existing = d.schedule[dateStr] || [];
      if (existing.includes(formatted)) {
        addToast(`${formatted} already exists for ${dateStr}`, "error");
        return d;
      }
      const nextArr = [...existing, formatted];
      nextArr.sort(
        (a, b) => parse12HourTimeToMinutes(a) - parse12HourTimeToMinutes(b),
      );
      return { ...d, schedule: { ...d.schedule, [dateStr]: nextArr } };
    });
    addToast(`Time slot ${formatted} added`, "success");
  };

  const removeSlot = (dateStr, slot) => {
    setDoc((d) => {
      const next = (d.schedule[dateStr] || []).filter((s) => s !== slot);
      return { ...d, schedule: { ...d.schedule, [dateStr]: next } };
    });
    addToast(`Removed ${slot} from ${dateStr}`, "info");
  };

  const removeDate = (dateStr) => {
    setDoc((d) => {
      const clone = { ...d.schedule };
      delete clone[dateStr];
      return { ...d, schedule: clone };
    });
    addToast(`Date ${dateStr} removed`, "info");
  };

  // handling image
  const handleImageChange = (e) => {
    if (!editing) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (imagePreview && imagePreview.startsWith("blob:"))
      URL.revokeObjectURL(imagePreview);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setLocalImageFile(file);
    setDoc((d) => ({ ...d, imageUrl: url }));
    addToast("Profile image updated locally", "success");
  };

  // to change availability
  const toggleAvailability = () => {
    setDoc((d) => {
      const current = d.availability === "Available" || d.available === true;
      const nextVal = current ? "Unavailable" : "Available";
      return { ...d, availability: nextVal, available: !current };
    });
    addToast("Availability toggled", "info");
  };

  // to reset the profile back to initial
  const handleReset = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to fetch");
      const d = json.data || json || {};
      d.schedule = dedupeAndSortSchedule(d.schedule || {});
      setDoc(d);
      setImagePreview(d.imageUrl || "");
      setLocalImageFile(null);
      setEditing(false);
      addToast("Reset to server profile", "info");
    } catch (err) {
      console.error("Reset error:", err);
      addToast("Reset failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // to update
  const handleSave = async () => {
    if (!doc) return;
    setSaveMessage({ type: "saving", text: "Saving profile..." });
    addToast("Saving profile...", "info");

    try {
      const form = new FormData();
      const updatable = [
        "name",
        "specialization",
        "experience",
        "qualifications",
        "location",
        "about",
        "fee",
        "availability",
        "success",
        "patients",
        "rating",
        "email",
      ];
      updatable.forEach((k) => {
        if (doc[k] !== undefined && doc[k] !== null) {
          form.append(k, String(doc[k]));
        }
      });

      form.append("schedule", JSON.stringify(doc.schedule || {}));

      if (localImageFile) {
        form.append("image", localImageFile);
      } else if (doc.imageUrl && !doc.imageUrl.startsWith("blob:")) {
        form.append("imageUrl", doc.imageUrl);
      }

      const token = localStorage.getItem(STORAGE_KEY);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`${API_BASE}/${id}`, {
        method: "PUT",
        headers,
        body: form,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.message || "Failed to save");
      }

      const updated = json.data || json;
      updated.schedule = dedupeAndSortSchedule(updated.schedule || {});
      setDoc(updated);
      setLocalImageFile(null);
      setImagePreview(updated.imageUrl || imagePreview);
      setEditing(false);
      setSaveMessage({ type: "success", text: "Profile saved successfully!" });
      addToast("Profile saved successfully!", "success");
      setTimeout(() => setSaveMessage(null), 1500);
    } catch (err) {
      console.error("handleSave error:", err);
      setSaveMessage({ type: "error", text: "Save failed" });
      addToast(err.message || "Save failed", "error");
    }
  };

  const fieldConfigs = doc
    ? [
      {
        icon: User,
        label: "Name",
        value: doc.name || "",
        onChange: (v) => setDoc((d) => ({ ...d, name: v })),
      },
      {
        icon: Briefcase,
        label: "Specialization",
        value: doc.specialization || "",
        onChange: (v) => setDoc((d) => ({ ...d, specialization: v })),
      },
      {
        icon: Clock,
        label: "Experience",
        value: doc.experience || "",
        onChange: (v) => setDoc((d) => ({ ...d, experience: v })),
      },
      {
        icon: GraduationCap,
        label: "Qualifications",
        value: doc.qualifications || "",
        onChange: (v) => setDoc((d) => ({ ...d, qualifications: v })),
      },
      {
        icon: MapPin,
        label: "Location",
        value: doc.location || "",
        onChange: (v) => setDoc((d) => ({ ...d, location: v })),
      },
      {
        icon: User,
        label: "Patients",
        value: doc.patients ?? "",
        onChange: (v) =>
          setDoc((d) => ({ ...d, patients: v === "" ? "" : Number(v) || 0 })),
      },
      {
        icon: CheckCircle,
        label: "Success",
        value: doc.success ?? "",
        onChange: (v) =>
          setDoc((d) => ({ ...d, success: v === "" ? "" : Number(v) || 0 })),
      },
      {
        icon: Star,
        label: "Rating (out of 5)",
        value: doc.rating ?? "",
        onChange: (v) =>
          setDoc((d) => ({
            ...d,
            rating: v === "" ? "" : parseFloat(v) || 0,
          })),
      },
      {
        icon: DollarSign,
        label: "Fee (INR)",
        value: doc.fee ?? "",
        onChange: (v) =>
          setDoc((d) => ({ ...d, fee: v === "" ? "" : Number(v) || 0 })),
      },
    ]
    : [];

  // if the state is in loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mx-auto" />
          <p className="mt-4 text-slate-500 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  // if the doctor is not found by id
  if (!doc) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex items-center justify-center">
        <p className="text-slate-500 font-semibold">Doctor not found.</p>
      </div>
    );
  }

  const isAvailable = doc.availability === "Available" || doc.available;

  // UI PART
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-7xl mx-auto">

        {/* ── TOASTS ── */}
        <div className="fixed top-6 right-6 z-50 flex flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg text-sm font-semibold transition-all duration-300 ${t.type === "error"
                  ? "bg-rose-50 border border-rose-200 text-rose-700"
                  : t.type === "info"
                    ? "bg-slate-50 border border-slate-200 text-slate-700"
                    : "bg-emerald-50 border border-emerald-200 text-emerald-700"
                }`}
            >
              {t.type === "error" ? <AlertCircle size={16} /> : <Check size={16} />}
              <span>{t.text}</span>
            </div>
          ))}
        </div>

        {/* ── HEADER ── */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              Edit Profile
            </h1>
            <p className="text-slate-500 mt-2">
              Manage your profile details and availability
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Availability toggle */}
            <button
              type="button"
              onClick={toggleAvailability}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm border transition-all duration-300 hover:-translate-y-0.5 ${isAvailable
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:shadow-md"
                  : "bg-slate-100 border-slate-200 text-slate-500 hover:shadow-md"
                }`}
            >
              <div className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${isAvailable ? "bg-emerald-500" : "bg-slate-300"}`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all duration-300 ${isAvailable ? "left-4" : "left-0.5"}`} />
              </div>
              {isAvailable ? "Available" : "Unavailable"}
            </button>

            {/* Edit / Cancel */}
            <button
              onClick={() => setEditing((s) => !s)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
            >
              <Edit2 size={16} />
              {editing ? "Cancel" : "Edit Profile"}
            </button>

            {/* Reset */}
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
            >
              Reset to Server
            </button>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={!editing || saveMessage?.type === "saving"}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm shadow-lg transition-all duration-300 hover:-translate-y-0.5 ${!editing || saveMessage?.type === "saving"
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                  : "bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600 hover:shadow-emerald-500/40"
                }`}
            >
              {saveMessage?.type === "saving" ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {saveMessage?.type === "saving" ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </div>

        {/* ── MAIN CARD ── */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">

          {/* Profile hero banner */}
          <div className="relative h-32 bg-gradient-to-r from-emerald-500 to-emerald-400">
            <div className="absolute -bottom-14 left-8">
              <div className="relative">
                <div className="w-28 h-28 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-slate-100">
                  <img
                    src={imagePreview || ""}
                    alt={doc.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <label
                  className={`absolute -bottom-2 -right-2 w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg transition-all ${editing
                      ? "bg-emerald-500 text-white cursor-pointer hover:bg-emerald-600"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={!editing}
                  />
                  <ImageIcon size={15} />
                </label>
              </div>
            </div>
          </div>

          <div className="pt-16 px-6 sm:px-8 pb-8">

            {/* Name + subtitle + inline stats */}
            <div className="mb-8">
              <h2 className="text-2xl font-black text-slate-900">{doc.name}</h2>
              <p className="text-slate-500 mt-1 flex items-center gap-2 text-sm">
                <Briefcase size={14} />
                {doc.specialization} · {doc.location}
              </p>

              <div className="flex flex-wrap gap-3 mt-4">
                {/* Patients */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <User size={14} className="text-emerald-600" />
                  <div>
                    <p className="text-xs text-emerald-600 font-medium">Patients</p>
                    {!editing ? (
                      <p className="text-sm font-black text-slate-900">{doc.patients}</p>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={doc.patients ?? ""}
                        onChange={(e) =>
                          setDoc((d) => ({
                            ...d,
                            patients: e.target.value === "" ? "" : Number(e.target.value),
                          }))
                        }
                        className="w-20 text-sm font-black text-slate-900 bg-transparent outline-none border-b border-emerald-300 focus:border-emerald-500"
                      />
                    )}
                  </div>
                </div>

                {/* Success */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-cyan-50 border border-cyan-100">
                  <CheckCircle size={14} className="text-cyan-600" />
                  <div>
                    <p className="text-xs text-cyan-600 font-medium">Success</p>
                    {!editing ? (
                      <p className="text-sm font-black text-slate-900">{doc.success}</p>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={doc.success ?? ""}
                        onChange={(e) =>
                          setDoc((d) => ({
                            ...d,
                            success: e.target.value === "" ? "" : Number(e.target.value),
                          }))
                        }
                        className="w-20 text-sm font-black text-slate-900 bg-transparent outline-none border-b border-cyan-300 focus:border-cyan-500"
                      />
                    )}
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-100">
                  <Star size={14} className="text-amber-500" />
                  <div>
                    <p className="text-xs text-amber-600 font-medium">Rating</p>
                    {!editing ? (
                      <p className="text-sm font-black text-slate-900">
                        {typeof doc.rating === "number" ? `${doc.rating}/5` : doc.rating}
                      </p>
                    ) : (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={5}
                          step={0.1}
                          value={doc.rating ?? ""}
                          onChange={(e) =>
                            setDoc((d) => ({
                              ...d,
                              rating: e.target.value === "" ? "" : parseFloat(e.target.value),
                            }))
                          }
                          className="w-14 text-sm font-black text-slate-900 bg-transparent outline-none border-b border-amber-300 focus:border-amber-500"
                        />
                        <span className="text-xs text-amber-600">/5</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Fee */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-50 border border-rose-100">
                  <BadgeIndianRupee size={14} className="text-rose-500" />
                  <div>
                    <p className="text-xs text-rose-600 font-medium">Fee (INR)</p>
                    {!editing ? (
                      <p className="text-sm font-black text-slate-900">₹{doc.fee}</p>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={doc.fee ?? ""}
                        onChange={(e) =>
                          setDoc((d) => ({
                            ...d,
                            fee: e.target.value === "" ? "" : Number(e.target.value),
                          }))
                        }
                        className="w-20 text-sm font-black text-slate-900 bg-transparent outline-none border-b border-rose-300 focus:border-rose-500"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── PERSONAL INFORMATION ── */}
            <div className="mb-8">
              <div className="px-6 py-5 border border-slate-100 rounded-3xl mb-0 bg-white shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-400 flex items-center justify-center shadow">
                    <User size={15} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Personal Information</h3>
                    <p className="text-sm text-slate-500">Basic profile details</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {fieldConfigs.map((field, index) => (
                    <div key={index} className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <field.icon size={12} />
                        {field.label}
                      </label>
                      <input
                        value={field.value}
                        onChange={(e) => editing && field.onChange(e.target.value)}
                        disabled={!editing}
                        readOnly={!editing}
                        className={`px-4 py-3 rounded-2xl border text-sm font-medium outline-none transition-all duration-200 ${editing
                            ? "border-slate-300 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 text-slate-900"
                            : "border-transparent bg-slate-50 text-slate-700 cursor-default"
                          }`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── ABOUT ── */}
            <div className="mb-8">
              <div className="px-6 py-5 border border-slate-100 rounded-3xl bg-white shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center shadow">
                    <Briefcase size={15} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">About</h3>
                    <p className="text-sm text-slate-500">Professional summary</p>
                  </div>
                </div>
                <div className="relative">
                  <textarea
                    rows={3}
                    value={doc.about || ""}
                    onChange={(e) =>
                      editing && setDoc((d) => ({ ...d, about: e.target.value }))
                    }
                    disabled={!editing}
                    readOnly={!editing}
                    placeholder="Tell patients about your expertise, approach, and philosophy..."
                    className={`w-full px-4 py-3 rounded-2xl border text-sm resize-none outline-none transition-all duration-200 ${editing
                        ? "border-slate-300 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 text-slate-900"
                        : "border-transparent bg-slate-50 text-slate-700 cursor-default"
                      }`}
                  />
                  <p className="text-xs text-slate-400 mt-1 text-right">
                    {(doc.about || "").length}/500
                  </p>
                </div>
              </div>
            </div>

            {/* ── SCHEDULE ── */}
            <div className="px-6 py-5 border border-slate-100 rounded-3xl bg-white shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-sky-400 flex items-center justify-center shadow">
                    <Calendar size={15} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Schedule & Availability</h3>
                    <p className="text-sm text-slate-500">Manage your appointment slots</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {editing && <AddDate onAdd={addDate} />}
                  {saveMessage && (
                    <span
                      className={`text-xs font-semibold px-3 py-1.5 rounded-xl ${saveMessage.type === "error"
                          ? "bg-rose-50 text-rose-600 border border-rose-200"
                          : saveMessage.type === "saving"
                            ? "bg-slate-50 text-slate-600 border border-slate-200"
                            : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        }`}
                    >
                      {saveMessage.text}
                    </span>
                  )}
                </div>
              </div>

              {Object.keys(doc.schedule || {}).length === 0 ? (
                <div className="text-center py-14 rounded-3xl border border-dashed border-slate-200 bg-slate-50">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mx-auto mb-3">
                    <Calendar size={22} className="text-slate-400" />
                  </div>
                  <p className="font-bold text-slate-700">No schedule added yet</p>
                  <p className="text-sm text-slate-500 mt-1">Add dates to create time slots</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(doc.schedule)
                    .sort(([a], [b]) => (a > b ? 1 : -1))
                    .map(([date, slots]) => (
                      <div
                        key={date}
                        className="rounded-3xl border border-slate-200 bg-white overflow-hidden hover:shadow-xl transition-all duration-300"
                      >
                        {/* Date header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-400 flex items-center justify-center shadow">
                              <Calendar size={15} className="text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                {new Date(date).toLocaleDateString("en-US", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                              <p className="text-xs text-slate-500">{date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700">
                              {slots.length} slot{slots.length !== 1 ? "s" : ""}
                            </span>
                            <button
                              onClick={() => editing && removeDate(date)}
                              disabled={!editing}
                              className={`w-7 h-7 rounded-xl flex items-center justify-center transition ${editing
                                  ? "bg-rose-50 text-rose-500 hover:bg-rose-100"
                                  : "bg-slate-100 text-slate-300 cursor-not-allowed"
                                }`}
                            >
                              <Trash size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Slots */}
                        <div className="p-3 flex flex-col gap-2">
                          {slots.map((slot, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between bg-slate-50 rounded-2xl px-3 py-2"
                            >
                              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <Clock size={13} className="text-emerald-500" />
                                {slot}
                              </div>
                              <button
                                onClick={() => editing && removeSlot(date, slot)}
                                disabled={!editing}
                                className={`w-6 h-6 rounded-lg flex items-center justify-center transition ${editing
                                    ? "text-rose-400 hover:bg-rose-50 hover:text-rose-600"
                                    : "text-slate-300 cursor-not-allowed"
                                  }`}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}

                          {editing && (
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="time"
                                className="flex-1 border border-slate-300 rounded-2xl px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && e.target.value) {
                                    addSlot(date, e.target.value);
                                    e.target.value = "";
                                  }
                                }}
                                onBlur={(e) => {
                                  if (e.target.value) {
                                    addSlot(date, e.target.value);
                                    e.target.value = "";
                                  }
                                }}
                              />
                              <button
                                onClick={(e) => {
                                  const input = e.currentTarget.previousElementSibling;
                                  if (input.value) {
                                    addSlot(date, input.value);
                                    input.value = "";
                                  }
                                }}
                                className="w-9 h-9 rounded-2xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20"
                              >
                                <Plus size={15} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// ── ADD DATE (logic untouched, restyled) ──
function AddDate({ onAdd }) {
  const [value, setValue] = useState("");
  const handleAdd = () => {
    if (value) {
      onAdd(value);
      setValue("");
    }
  };
  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        min={new Date().toISOString().split("T")[0]}
        className="border border-slate-300 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition"
        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
      />
      <button
        onClick={handleAdd}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 hover:-translate-y-0.5 transition-all duration-300"
      >
        <Plus size={16} />
        Add Date
      </button>
    </div>
  );
}
