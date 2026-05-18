import React, { useEffect, useRef, useState } from "react";
import { addServiceStyles } from "../assets/dummyStyles";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Image,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";

const AddService = ({ serviceId }) => {
  const API_BASE = "http://localhost:4000";

  const fileRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [hasExistingImage, setHasExistingImage] = useState(false); // to update the image if found
  const [removeImage, setRemoveImage] = useState(false); // existing one

  const [serviceName, setServiceName] = useState("");
  const [about, setAbout] = useState("");
  const [price, setPrice] = useState("");
  const [availability, setAvailability] = useState("available");

  const [instructions, setInstructions] = useState([""]);
  const [slots, setSlots] = useState([]);

  // Date / time controls for adding slots
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDate = today.getDate();

  const years = Array.from({ length: 5 }).map((_, i) => currentYear + i);
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
  const hours = Array.from({ length: 12 }).map((_, i) =>
    String(i + 1).padStart(2, "0"),
  );
  const minutes = Array.from({ length: 12 }).map((_, i) =>
    String(i * 5).padStart(2, "0"),
  );
  const ampm = ["AM", "PM"];

  // Initial values as strings matching options
  const [slotDay, setSlotDay] = useState(String(currentDate));
  const [slotMonth, setSlotMonth] = useState(String(currentMonth));
  const [slotYear, setSlotYear] = useState(String(currentYear));
  // For time
  const [slotHour, setSlotHour] = useState("11");
  const [slotMinute, setSlotMinute] = useState("00");
  const [slotAmPm, setSlotAmPm] = useState("AM");

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});

  // Compute the days for selected month / year (respecting the month length)
  const selectedYearNum = Number(slotYear);
  const selectedMonthNum = Number(slotMonth);
  const daysInSelectedMonth = new Date(
    selectedYearNum,
    selectedMonthNum + 1,
    0,
  ).getDate();
  const days = Array.from({ length: daysInSelectedMonth }).map((_, i) =>
    String(i + 1),
  );

  // User cant select previous year/ month/ date from today
  useEffect(() => {
    if (Number(slotDay) > daysInSelectedMonth) {
      setSlotDay(String(daysInSelectedMonth));
    }
  }, [slotMonth, slotYear, daysInSelectedMonth]);

  // To fetch services when in editing state
  useEffect(() => {
    let mounted = true;
    async function loadService() {
      if (!serviceId) return;
      try {
        const res = await fetch(`${API_BASE}/api/services/${serviceId}`);
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          console.warn("Failed to fetch service:", res.status, txt);
          showToast(
            "error",
            "Load failed",
            "Could not load service for editing.",
          );
          return;
        }
        const payload = await res.json().catch(() => null);
        const data = payload?.data || payload;
        if (!data) return;
        if (!mounted) return;

        setServiceName(data.name || "");
        setAbout(data.about || data.description || "");
        setPrice(data.price != null ? String(data.price) : "");
        setAvailability(data.available ? "available" : "unavailable");
        setInstructions(
          Array.isArray(data.instructions) && data.instructions.length
            ? data.instructions
            : [""],
        );
        setSlots(Array.isArray(data.slots) ? data.slots : []);
        if (data.imageUrl) {
          setImagePreview(data.imageUrl);
          setHasExistingImage(true);
          setRemoveImage(false);
        } else {
          setImagePreview(null);
          setHasExistingImage(false);
        }
      } catch (err) {
        console.error("loadService error:", err);
        showToast("error", "Network error", "Could not load service.");
      }
    }
    loadService();
    return () => {
      mounted = false;
    };
  }, [serviceId, API_BASE]); // Pre fetch for that particular service if present

  // Image change
  function handleImageChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (imagePreview && imagePreview.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(imagePreview);
      } catch (err) { }
    }
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
    // remove the existing image if user chooses a new file
    setRemoveImage(false);
    setHasExistingImage(false);
  }

  // Instruction helpers
  function addInstruction() {
    setInstructions((s) => [...s, ""]);
  }
  function updateInstruction(i, v) {
    setInstructions((s) => s.map((x, idx) => (idx === i ? v : x)));
  }
  function removeInstruction(i) {
    setInstructions((s) => s.filter((_, idx) => idx !== i));
  }

  // Reset the form back to initial state
  function resetForm() {
    if (imagePreview && imagePreview.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(imagePreview);
      } catch (err) { }
    }
    setImagePreview(null);
    setImageFile(null);
    setHasExistingImage(false);
    setRemoveImage(false);
    setServiceName("");
    setAbout("");
    setPrice("");
    setAvailability("available");
    setInstructions([""]);
    setSlots([]);
    setErrors({});
  }

  // To show toast for 3.5sec
  function showToast(type, title, message) {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 3500);
  }

  // Convert selected 12Hrs components to a Date Object
  function selectedDateTime() {
    const d = Number(slotDay);
    const m = Number(slotMonth);
    const y = Number(slotYear);
    let h = Number(slotHour);
    const mm = Number(slotMinute);
    const ap = slotAmPm;

    if (ap === "AM") {
      if (h === 12) h = 0;
    } else {
      if (h !== 12) h = h + 12;
    }

    return new Date(y, m, d, h, mm, 0, 0);
  }

  // To prevent user for selecting the past time for that particular date
  function isSelectedDateTimeInPast() {
    const sel = selectedDateTime();
    return sel.getTime() <= Date.now();
  }

  // To add or update slots
  function addSlot() {
    const m = months[Number(slotMonth)];
    const d = String(slotDay).padStart(2, "0");
    const y = slotYear;
    const h = String(slotHour).padStart(2, "0");
    const mm = slotMinute;
    const ap = slotAmPm;
    const formatted = `${d} ${m} ${y} • ${h}:${mm} ${ap}`;

    if (slots.includes(formatted)) {
      showToast(
        "error",
        "Duplicate Slot",
        "This time slot has already been added. Please select a different time.",
      );
      return;
    }

    if (isSelectedDateTimeInPast()) {
      showToast(
        "error",
        "Past Time",
        "You cannot add a time slot in the past. Please select a future date/time.",
      );
      setErrors((e) => ({ ...e, slots: true }));
      return;
    }

    setSlots((s) => [...s, formatted]);
    setErrors((e) => ({ ...e, slots: false }));
    showToast("success", "Slot Added", `Time slot added: ${formatted}`);
  }

  function removeSlot(i) {
    const removedSlot = slots[i];
    setSlots((s) => s.filter((_, idx) => idx !== i));
    showToast("info", "Slot Removed", `Removed: ${removedSlot}`);
  }

  // To validate that all fields are filled by user or not
  function validate() {
    const newErrors = {};
    if (!imageFile && !hasExistingImage) newErrors.image = true;
    if (!serviceName.trim()) newErrors.serviceName = true;
    if (!about.trim()) newErrors.about = true;
    if (!String(price).trim()) newErrors.price = true;
    if (!instructions.some((ins) => ins.trim())) newErrors.instructions = true;
    if (!slots.length) newErrors.slots = true;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // Submit function for creation or update
  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) {
      showToast(
        "error",
        "Missing Fields",
        "Please fill all required fields before submitting.",
      );
      return;
    }

    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append("name", serviceName);
      fd.append("about", about);
      const numericPrice = String(price).replace(/[^\d.-]/g, "");
      fd.append("price", numericPrice === "" ? "0" : numericPrice);
      fd.append("availability", availability);
      // arrays serialized as JSON
      fd.append("instructions", JSON.stringify(instructions));
      fd.append("slots", JSON.stringify(slots));

      if (imageFile) {
        fd.append("image", imageFile);
      } else if (removeImage) {
        fd.append("removeImage", "true");
      }

      const url = serviceId
        ? `${API_BASE}/api/services/${serviceId}`
        : `${API_BASE}/api/services`;
      const method = serviceId ? "PUT" : "POST";

      const res = await fetch(url, { method, body: fd });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = data?.message || `Server error (${res?.status || "?"})`;
        showToast("error", "Save Failed", msg);
        setSubmitting(false);
        return;
      }

      showToast(
        "success",
        serviceId ? "Service Updated" : "Service Added",
        `${serviceName} saved with ${slots.length} slot(s).`,
      );

      if (!serviceId) {
        resetForm();
        if (fileRef.current) fileRef.current.value = null;
      } else {
        const saved = data?.data || null;
        if (saved) {
          setHasExistingImage(Boolean(saved.imageUrl));
          setImagePreview(saved.imageUrl || null);
          setImageFile(null);
          setRemoveImage(false);
        }
      }
    } catch (err) {
      console.error("service submit error:", err);
      showToast("error", "Network error", "Could not reach server.");
    } finally {
      setSubmitting(false);
    }
  }

  // Replace your current return() UI with this updated modern UI
  // similar to AddDoctor & ListDoctor pages

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-7xl mx-auto">
        {/* HERO SECTION */}
        <div className="relative overflow-hidden rounded-[2rem] border border-emerald-100 bg-white/80 backdrop-blur-xl shadow-xl p-6 sm:p-8 mb-8">
          <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-100 rounded-full blur-3xl opacity-40" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold mb-4">
                <Image size={16} />
                {serviceId ? "Edit Service" : "Add Service"}
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-slate-800 leading-tight">
                Create Amazing
                <span className="block bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                  Service Profiles
                </span>
              </h1>

              <p className="mt-4 text-slate-600 max-w-2xl text-sm sm:text-base leading-relaxed">
                Add premium healthcare services with schedules, pricing,
                instructions and availability management.
              </p>
            </div>

            <div className="hidden lg:flex items-center justify-center">
              <div className="w-44 h-44 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center shadow-2xl">
                <Calendar className="text-white" size={80} />
              </div>
            </div>
          </div>
        </div>

        {/* FORM */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-[2rem] shadow-xl p-5 sm:p-8">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* IMAGE SECTION */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Upload Service Image
                </label>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="w-full h-72 rounded-3xl overflow-hidden border-2 border-dashed border-slate-300 flex items-center justify-center bg-white">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-slate-400">
                        <Image size={60} className="mx-auto mb-3" />
                        <p>Upload Service Image</p>
                      </div>
                    )}
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    ref={fileRef}
                    onChange={handleImageChange}
                    className="hidden"
                  />

                  <div className="flex gap-3 mt-5">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex-1 rounded-2xl bg-emerald-500 text-white py-3 font-semibold hover:bg-emerald-600 transition-all"
                    >
                      {imagePreview ? "Replace Image" : "Upload Image"}
                    </button>

                    {imagePreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setImageFile(null);
                        }}
                        className="rounded-2xl bg-red-50 text-red-500 px-4 hover:bg-red-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE */}
              <div className="lg:col-span-2 space-y-6">
                {/* TOP INPUTS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <input
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    placeholder="Service Name"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-medium outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />

                  <input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Price ₹"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-medium outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />

                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-medium outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  >
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>

                {/* ABOUT */}
                <textarea
                  rows={5}
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="About Service"
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-medium outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />

                {/* INSTRUCTIONS */}
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-black text-slate-800">
                      Instructions
                    </h3>

                    <button
                      type="button"
                      onClick={addInstruction}
                      className="flex items-center gap-2 rounded-2xl bg-emerald-500 text-white px-4 py-2 font-semibold hover:bg-emerald-600"
                    >
                      <Plus size={18} />
                      Add
                    </button>
                  </div>

                  <div className="space-y-3">
                    {instructions.map((ins, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                          {idx + 1}
                        </div>

                        <input
                          value={ins}
                          onChange={(e) =>
                            updateInstruction(idx, e.target.value)
                          }
                          placeholder={`Instruction ${idx + 1}`}
                          className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-400"
                        />

                        {instructions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeInstruction(idx)}
                            className="text-red-500"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* SLOT SECTION */}
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-2 mb-5">
                    <Calendar className="text-emerald-600" />
                    <h3 className="text-lg font-black text-slate-800">
                      Service Slots
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <select
                      value={slotDay}
                      onChange={(e) => setSlotDay(e.target.value)}
                      className="rounded-2xl border border-slate-200 px-4 py-3"
                    >
                      {days.map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>

                    <select
                      value={slotMonth}
                      onChange={(e) => setSlotMonth(e.target.value)}
                      className="rounded-2xl border border-slate-200 px-4 py-3"
                    >
                      {months.map((m, idx) => (
                        <option key={m} value={idx}>
                          {m}
                        </option>
                      ))}
                    </select>

                    <select
                      value={slotYear}
                      onChange={(e) => setSlotYear(e.target.value)}
                      className="rounded-2xl border border-slate-200 px-4 py-3"
                    >
                      {years.map((y) => (
                        <option key={y}>{y}</option>
                      ))}
                    </select>

                    <select
                      value={slotHour}
                      onChange={(e) => setSlotHour(e.target.value)}
                      className="rounded-2xl border border-slate-200 px-4 py-3"
                    >
                      {hours.map((h) => (
                        <option key={h}>{h}</option>
                      ))}
                    </select>

                    <select
                      value={slotMinute}
                      onChange={(e) => setSlotMinute(e.target.value)}
                      className="rounded-2xl border border-slate-200 px-4 py-3"
                    >
                      {minutes.map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>

                    <select
                      value={slotAmPm}
                      onChange={(e) => setSlotAmPm(e.target.value)}
                      className="rounded-2xl border border-slate-200 px-4 py-3"
                    >
                      {ampm.map((a) => (
                        <option key={a}>{a}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={addSlot}
                    className="mt-5 flex items-center gap-2 rounded-2xl bg-emerald-500 text-white px-5 py-3 font-semibold hover:bg-emerald-600"
                  >
                    <Plus size={18} />
                    Add Slot
                  </button>

                  {/* SLOT LIST */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
                    {slots.map((s, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-2xl bg-white border border-slate-200 px-4 py-3"
                      >
                        <span className="text-sm font-semibold text-slate-700">
                          {s}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeSlot(idx)}
                          className="text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 rounded-2xl border border-slate-200 font-semibold hover:bg-slate-100"
                  >
                    Reset
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-8 py-3 rounded-2xl text-white font-bold shadow-lg transition-all duration-300 ${submitting
                        ? "bg-slate-400"
                        : "bg-gradient-to-r from-emerald-500 to-cyan-500 hover:scale-105"
                      }`}
                  >
                    {submitting
                      ? "Saving..."
                      : serviceId
                        ? "Update Service"
                        : "Add Service"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* TOAST */}
        {toast && (
          <div
            className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white ${toast.type === "success"
                ? "bg-emerald-500"
                : toast.type === "info"
                  ? "bg-cyan-500"
                  : "bg-red-500"
              }`}
          >
            {toast.type === "success" ? (
              <CheckCircle size={22} />
            ) : toast.type === "info" ? (
              <Clock size={22} />
            ) : (
              <AlertTriangle size={22} />
            )}

            <div>
              <div className="font-bold">{toast.title}</div>
              <div className="text-sm opacity-90">{toast.message}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddService;
