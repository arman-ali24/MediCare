import React, { useEffect, useRef, useState } from "react";
import { doctorDetailStyles as s } from "../assets/dummyStyles";
import {
  Calendar,
  CheckCircle,
  Eye,
  EyeClosed,
  Plus,
  Trash2,
  User,
  XCircle,
} from "lucide-react";

// HELPERS FUNCTIONS
// This function will give output in minutes and according to that it will manage am : pm
function timeStringToMinutes(t) {
  if (!t) return 0;
  const [hhmm, ampm] = t.split(" ");
  let [h, m] = hhmm.split(":").map(Number);
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

// This function will convert (YYYY-MM-DD) to Date Month Year
function formatDateISO(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
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

const AddPage = () => {
  const [doctorList, setDoctorList] = useState([]);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    specialization: "",
    imageFile: null,
    imagePreview: "",
    experience: "",
    qualifications: "",
    location: "",
    about: "",
    fee: "",
    success: "",
    patients: "",
    rating: "",
    schedule: {}, // slots
    availability: "Available",
    email: "",
    password: "",
  });

  const [slotDate, setSlotDate] = useState("");
  const [slotHour, setSlotHour] = useState("");
  const [slotMinute, setSlotMinute] = useState("00");
  const [slotAmpm, setSlotAmpm] = useState("AM");

  const [toast, setToast] = useState({
    show: false,
    type: "success",
    message: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Compute todays date in local timezone.
  const [today] = useState(() => {
    const d = new Date();
    const tzOffset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - tzOffset * 60000);
    return local.toISOString().split("T")[0];
  });

  // It will show a toast for 3 sec
  useEffect(() => {
    if (!toast.show) return;
    const t = setTimeout(() => setToast((s) => ({ ...s, show: false })), 3000);
    return () => clearTimeout(t);
  }, [toast.show]);

  const showToast = (type, message) => setToast({ show: true, type, message });

  // This function show the image preview
  function handleImage(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (form.imagePreview && form.imageFile) {
      try {
        URL.revokeObjectURL(form.imagePreview);
      } catch (err) { }
    }
    setForm((p) => ({
      ...p,
      imageFile: file,
      imagePreview: URL.createObjectURL(file),
    }));
  }

  // This function will remove the image preview
  function removeImage() {
    if (form.imagePreview && form.imageFile) {
      try {
        URL.revokeObjectURL(form.imagePreview);
      } catch (err) { }
    }
    setForm((p) => ({ ...p, imageFile: null, imagePreview: "" }));
    if (fileInputRef.current) {
      try {
        fileInputRef.current.value = "";
      } catch (err) { }
    }
  }

  // To add slots
  function addSlotToForm() {
    if (!slotDate || !slotHour) {
      showToast("error", "Select date + time");
      return;
    }
    // Prevent previous date
    if (slotDate < today) {
      showToast("error", "Cannot add a slot in the past");
      return;
    }
    const time = `${slotHour}:${slotMinute} ${slotAmpm}`;
    // If date is of today then prevent from time
    if (slotDate === today) {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const slotMinutes = timeStringToMinutes(time);
      if (slotMinutes <= nowMinutes) {
        showToast("error", "Cannot add a time that has already passed today");
        return;
      }
    }

    setForm((f) => {
      const sched = { ...f.schedule };
      if (!sched[slotDate]) sched[slotDate] = [];
      if (!sched[slotDate].includes(time)) sched[slotDate].push(time);

      sched[slotDate] = sched[slotDate].sort(
        (a, b) => timeStringToMinutes(a) - timeStringToMinutes(b),
      );
      return { ...f, schedule: sched };
    });

    setSlotHour("");
    setSlotMinute("00");
  }

  // To remove the added slot
  function removeSlot(date, time) {
    setForm((f) => {
      const sched = { ...f.schedule };
      sched[date] = sched[date].filter((t) => t !== time);
      if (!sched[date].length) delete sched[date];
      return { ...f, schedule: sched };
    });
  }

  // It will convert schedule object into an array
  function getFlatSlots(s) {
    const arr = [];
    Object.keys(s)
      .sort()
      .forEach((d) => {
        s[d].forEach((t) => arr.push({ date: d, time: t }));
      });
    return arr;
  }

  function validate(f) {
    const req = [
      "name",
      "specialization",
      "experience",
      "qualifications",
      "location",
      "about",
      "fee",
      "success",
      "patients",
      "rating",
      "email",
      "password",
    ];

    for (let k of req) if (!f[k]) return false;
    if (!f.imageFile) return false;
    if (!Object.keys(f.schedule).length) return false;
    return true;
  }

  // To add a doctor
  async function handleAdd(e) {
    e.preventDefault();
    if (!validate(form)) {
      showToast("error", "Fill all fields + upload image + add slot");
      return;
    }
    const r = Number(form.rating);
    if (Number.isNaN(r) || r < 1 || r > 5) {
      showToast("error", "Rating must be a number between 1 and 5");
      return;
    }
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("specialization", form.specialization || "");
      fd.append("experience", form.experience || "");
      fd.append("qualifications", form.qualifications || "");
      fd.append("location", form.location || "");
      fd.append("about", form.about || "");
      fd.append("fee", form.fee === "" ? "0" : String(form.fee));
      fd.append("success", form.success || "");
      fd.append("patients", form.patients || "");
      fd.append("rating", form.rating === "" ? "0" : String(form.rating));
      fd.append("availability", form.availability || "Available");
      fd.append("email", form.email);
      fd.append("password", form.password);
      fd.append("schedule", JSON.stringify(form.schedule || {}));

      if (form.imageFile) fd.append("image", form.imageFile);

      const API_BASE = "http://localhost:4000/api";

      const res = await fetch(`${API_BASE}/doctors`, {
        method: "POST",
        body: fd,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = data?.message || `Server error (${res.status})`;
        showToast("error", msg);
        setLoading(false);
        return;
      }

      showToast("success", "Doctor Added Successfully!");

      if (data?.token) {
        try {
          localStorage.setItem("token", data.token);
        } catch (err) { }
      }

      const doctorFromServer = data?.data
        ? data.data
        : { id: Date.now(), ...form, imageUrl: form.imagePreview };

      setDoctorList((old) => [doctorFromServer, ...old]);

      // cleanup: revoke object URL if used
      if (form.imagePreview && form.imageFile) {
        try {
          URL.revokeObjectURL(form.imagePreview);
        } catch (err) { }
      }

      // reset the field after submit is done
      setForm({
        name: "",
        specialization: "",
        imageFile: null,
        imagePreview: "",
        experience: "",
        qualifications: "",
        location: "",
        about: "",
        fee: "",
        success: "",
        patients: "",
        rating: "",
        schedule: {},
        availability: "Available",
        email: "",
        password: "",
      });

      if (fileInputRef.current) {
        try {
          fileInputRef.current.value = "";
        } catch (err) { }
      }

      setSlotDate("");
      setSlotHour("");
      setSlotMinute("00");
      setShowPassword(false);
    } catch (err) {
      console.error("submit error:", err);
      showToast("error", "Network or server error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-7xl mx-auto">
        {/* HERO SECTION */}
        <div className="relative overflow-hidden rounded-[2rem] border border-emerald-100 bg-white/80 backdrop-blur-xl shadow-xl p-6 sm:p-8 mb-8">
          <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-100 rounded-full blur-3xl opacity-40" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold mb-4">
                <User size={16} />
                Add Doctor Section
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-slate-800 leading-tight">
                Add New
                <span className="block bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                  Doctor Profile
                </span>
              </h1>

              <p className="mt-4 text-slate-600 max-w-2xl text-sm sm:text-base leading-relaxed">
                Create and manage doctor profiles, schedules, availability,
                and appointment slots from one centralized admin panel.
              </p>
            </div>

            <div className="hidden lg:flex items-center justify-center">
              <div className="w-44 h-44 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center shadow-2xl">
                <User className="text-white" size={80} />
              </div>
            </div>
          </div>
        </div>

        {/* FORM */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-[2rem] shadow-xl p-5 sm:p-8">
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* IMAGE */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-3">
                Upload Profile Image
              </label>

              <div className="flex flex-wrap items-center gap-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImage}
                  className="block w-full text-sm text-slate-500
                file:mr-4 file:py-3 file:px-5
                file:rounded-2xl file:border-0
                file:text-sm file:font-semibold
                file:bg-emerald-500 file:text-white
                hover:file:bg-emerald-600"
                />

                {form.imagePreview && (
                  <div className="relative">
                    <img
                      src={form.imagePreview}
                      alt="preview"
                      className="w-28 h-28 rounded-3xl object-cover border-4 border-white shadow-lg"
                    />

                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* INPUTS */}
            {[
              ["Full Name", "name"],
              ["Specialization", "specialization"],
              ["Location", "location"],
              ["Experience", "experience"],
              ["Qualifications", "qualifications"],
              ["Consultation Fee", "fee"],
              ["Patients", "patients"],
              ["Success Rate", "success"],
            ].map(([placeholder, key]) => (
              <input
                key={key}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-medium outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all duration-300"
                placeholder={placeholder}
                value={form[key]}
                onChange={(e) =>
                  setForm({ ...form, [key]: e.target.value })
                }
              />
            ))}

            {/* RATING */}
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-medium outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all duration-300"
              placeholder="Rating (1.0 - 5.0)"
              type="number"
              min={1}
              max={5}
              step={0.1}
              value={form.rating}
              onChange={(e) => {
                const v = e.target.value;

                if (v === "") {
                  setForm((p) => ({ ...p, rating: "" }));
                  return;
                }

                const n = Number(v);
                if (Number.isNaN(n)) return;

                const clamped = Math.max(1, Math.min(5, n));
                const fixed = Math.round(clamped * 10) / 10;

                setForm((p) => ({
                  ...p,
                  rating: fixed.toString(),
                }));
              }}
            />

            {/* EMAIL */}
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-medium outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all duration-300"
              placeholder="Doctor Email"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />

            {/* PASSWORD */}
            <div className="relative">
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 pr-12 text-sm font-medium outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all duration-300"
                placeholder="Doctor Password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
              />

              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
              >
                {showPassword ? (
                  <Eye size={18} />
                ) : (
                  <EyeClosed size={18} />
                )}
              </button>
            </div>

            {/* AVAILABILITY */}
            <select
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-medium outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all duration-300"
              value={form.availability}
              onChange={(e) =>
                setForm({
                  ...form,
                  availability: e.target.value,
                })
              }
            >
              <option value="Available">Available</option>
              <option value="Unavailable">Unavailable</option>
            </select>

            {/* ABOUT */}
            <textarea
              rows={4}
              placeholder="About Doctor"
              value={form.about}
              onChange={(e) =>
                setForm({ ...form, about: e.target.value })
              }
              className="md:col-span-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-medium outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all duration-300"
            />

            {/* SCHEDULE */}
            <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-2 mb-5">
                <Calendar className="text-emerald-600" />
                <h3 className="text-lg font-black text-slate-800">
                  Add Schedule Slots
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <input
                  type="date"
                  value={slotDate}
                  min={today}
                  onChange={(e) => setSlotDate(e.target.value)}
                  className="rounded-2xl border border-slate-200 px-4 py-3"
                />

                <select
                  value={slotHour}
                  onChange={(e) => setSlotHour(e.target.value)}
                  className="rounded-2xl border border-slate-200 px-4 py-3"
                >
                  <option value="">Hour</option>

                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i} value={String(i + 1)}>
                      {i + 1}
                    </option>
                  ))}
                </select>

                <select
                  value={slotMinute}
                  onChange={(e) => setSlotMinute(e.target.value)}
                  className="rounded-2xl border border-slate-200 px-4 py-3"
                >
                  {Array.from({ length: 60 }).map((_, i) => (
                    <option
                      key={i}
                      value={String(i).padStart(2, "0")}
                    >
                      {String(i).padStart(2, "0")}
                    </option>
                  ))}
                </select>

                <select
                  value={slotAmpm}
                  onChange={(e) => setSlotAmpm(e.target.value)}
                  className="rounded-2xl border border-slate-200 px-4 py-3"
                >
                  <option>AM</option>
                  <option>PM</option>
                </select>

                <button
                  type="button"
                  onClick={addSlotToForm}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-all duration-300"
                >
                  <Plus size={18} />
                  Add Slot
                </button>
              </div>

              {/* SLOT LIST */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
                {getFlatSlots(form.schedule).map(({ date, time }) => (
                  <div
                    key={date + time}
                    className="flex items-center justify-between rounded-2xl bg-white border border-slate-200 px-4 py-3"
                  >
                    <span className="text-sm font-semibold text-slate-700">
                      {formatDateISO(date)} — {time}
                    </span>

                    <button
                      onClick={() => removeSlot(date, time)}
                      className="text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* SUBMIT */}
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className={`px-8 py-4 rounded-2xl text-white font-bold shadow-lg transition-all duration-300 ${loading
                  ? "bg-slate-400"
                  : "bg-gradient-to-r from-emerald-500 to-cyan-500 hover:scale-105"
                  }`}
              >
                {loading
                  ? "Adding..."
                  : "Add Doctor to Team"}
              </button>
            </div>
          </form>
        </div>

        {/* TOAST */}
        {toast.show && (
          <div
            className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white ${toast.type === "success"
              ? "bg-emerald-500"
              : "bg-red-500"
              }`}
          >
            {toast.type === "success" ? (
              <CheckCircle size={22} />
            ) : (
              <XCircle size={22} />
            )}

            <span className="font-semibold">
              {toast.message}
            </span>
          </div>
        )}

        {/* DOCTOR LIST */}
        <div className="mt-8">
          {doctorList.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {doctorList.map((d) => (
                <div
                  key={d.id || d._id}
                  className="rounded-3xl border border-slate-200 bg-white/80 backdrop-blur-xl p-5 shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={d.imageUrl || d.imagePreview}
                      alt={d.name}
                      className="w-20 h-20 rounded-3xl object-cover"
                    />

                    <div>
                      <h3 className="font-black text-slate-800 text-lg">
                        {d.name}
                      </h3>

                      <p className="text-sm text-emerald-600 font-semibold">
                        {d.specialization}
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        {d.location}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-14 text-slate-500 font-semibold">
              No doctors Yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddPage;
