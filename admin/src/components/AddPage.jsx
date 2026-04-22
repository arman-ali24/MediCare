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
      } catch (err) {}
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
      } catch (err) {}
    }
    setForm((p) => ({ ...p, imageFile: null, imagePreview: "" }));
    if (fileInputRef.current) {
      try {
        fileInputRef.current.value = "";
      } catch (err) {}
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
        } catch (err) {}
      }

      const doctorFromServer = data?.data
        ? data.data
        : { id: Date.now(), ...form, imageUrl: form.imagePreview };

      setDoctorList((old) => [doctorFromServer, ...old]);

      // cleanup: revoke object URL if used
      if (form.imagePreview && form.imageFile) {
        try {
          URL.revokeObjectURL(form.imagePreview);
        } catch (err) {}
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
        } catch (err) {}
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
    <div className={s.pageContainer}>
      <div className={s.maxWidthContainerLg + " " + s.headerContainer}>
        <div className={s.headerFlexContainer}>
          <div className={s.headerIconContainer}>
            <User className="text-white" size={32} />
          </div>
          <h1 className={s.headerTitle}>Add New Doctor</h1>
        </div>
      </div>

      {/* Form */}
      <div className={s.maxWidthContainer + " " + s.formContainer}>
        <form onSubmit={handleAdd} className={s.formGrid}>
          <div className="md:col-span-2">
            <label className={s.label}>Upload Profile Image</label>
            <div className="flex flex-wrap items-center gap-4">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImage}
                className={s.fileInput}
              />

              {form.imagePreview && (
                <div className="relative-group">
                  <img
                    src={form.imagePreview}
                    alt="preview"
                    className={s.imagePreview}
                  />

                  <button
                    type="button"
                    onClick={removeImage}
                    className={s.removeImageButton + " " + s.cursorPointer}
                  >
                    <XCircle size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <input
            className={s.inputBase}
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className={s.inputBase}
            placeholder="Specialization"
            value={form.specialization}
            onChange={(e) =>
              setForm({ ...form, specialization: e.target.value })
            }
          />
          <input
            className={s.inputBase}
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />

          <input
            className={s.inputBase}
            placeholder="Experience"
            value={form.experience}
            onChange={(e) => setForm({ ...form, experience: e.target.value })}
          />

          <input
            className={s.inputBase}
            placeholder="Qualifications"
            value={form.qualifications}
            onChange={(e) =>
              setForm({ ...form, qualifications: e.target.value })
            }
          />

          <input
            className={s.inputBase}
            placeholder="Consultation Fee"
            value={form.fee}
            onChange={(e) => setForm({ ...form, fee: e.target.value })}
          />

          <input
            className={s.inputBase}
            placeholder="Rating (1.0 - 5.0)"
            type="number"
            min={1}
            max={5}
            step={0.1}
            value={form.rating}
            onChange={(e) => {
              const v = e.target.value;

              // allow clearing
              if (v === "") {
                setForm((p) => ({ ...p, rating: "" }));
                return;
              }

              const n = Number(v);
              if (Number.isNaN(n)) return;

              // clamp between 1 and 5
              const clamped = Math.max(1, Math.min(5, n));

              // keep only 1 decimal place
              const fixed = Math.round(clamped * 10) / 10;

              setForm((p) => ({ ...p, rating: fixed.toString() }));
            }}
            onBlur={() => {
              // force 1 decimal place on blur
              setForm((p) => {
                if (!p.rating) return p;
                const n = Number(p.rating);
                if (Number.isNaN(n)) return { ...p, rating: "" };

                const clamped = Math.max(1, Math.min(5, n));
                return { ...p, rating: clamped.toFixed(1) };
              });
            }}
          />
          <input
            className={s.inputBase}
            placeholder="Patients"
            value={form.patients}
            onChange={(e) => setForm({ ...form, patients: e.target.value })}
          />

          <input
            className={s.inputBase}
            placeholder="Success Rate"
            value={form.success}
            onChange={(e) => setForm({ ...form, success: e.target.value })}
          />
          <input
            className={s.inputBase}
            placeholder="Doctor Email"
            value={form.email}
            type="email"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <div className="relative">
            <input
              className={s.inputBase + " " + s.inputWithIcon}
              placeholder="Doctor Password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className={s.passwordToggleButton + " " + s.cursorPointer}
            >
              {showPassword ? <Eye size={18} /> : <EyeClosed size={18} />}
            </button>
          </div>

          <select
            className={s.inputBase}
            value={form.availability}
            onChange={(e) => setForm({ ...form, availability: e.target.value })}
          >
            <option value="Available">Available</option>
            <option value="Unavailable">Unavailable</option>
          </select>

          <textarea
            className={s.textareaBase + "md:col-span-2"}
            rows={3}
            placeholder="About Doctor"
            value={form.about}
            onChange={(e) => setForm({ ...form, about: e.target.value })}
          ></textarea>
          {/* SCHEDULE */}
          <div className={s.scheduleContainer + " md:col-span-2"}>
            <div className={s.scheduleHeader}>
              <Calendar className="text-emerald-600" />
              <p className={s.scheduleTitle}>Add Schedule Slots</p>
            </div>

            <div className={s.scheduleInputsContainer}>
              <input
                type="date"
                value={slotDate}
                min={today}
                onChange={(e) => setSlotDate(e.target.value)}
                className={s.scheduleDateInput}
              />

              <select
                value={slotHour}
                onChange={(e) => setSlotHour(e.target.value)}
                className={s.scheduleTimeSelect}
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
                className={s.scheduleTimeSelect}
              >
                {Array.from({ length: 60 }).map((_, i) => (
                  <option key={i} value={String(i).padStart(2, "0")}>
                    {String(i).padStart(2, "0")}
                  </option>
                ))}
              </select>

              <select
                value={slotAmpm}
                onChange={(e) => setSlotAmpm(e.target.value)}
                className={s.scheduleTimeSelect}
              >
                <option>AM</option>
                <option>PM</option>
              </select>

              <button
                type="button"
                onClick={addSlotToForm}
                className={s.addSlotButton + " " + s.cursorPointer}
              >
                <Plus size={18} /> Add Slot
              </button>
            </div>

            <div className={s.slotsGrid}>
              {getFlatSlots(form.schedule).map(({ date, time }) => (
                <div
                  key={date + time}
                  className={s.slotItem + " " + s.cursorPointer}
                >
                  <span>
                    {formatDateISO(date)} — {time}
                  </span>
                  <button
                    onClick={() => removeSlot(date, time)}
                    className="text-rose-500"
                    aria-label={`Remove slot ${date} ${time}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className={s.submitButtonContainer}>
            <button
              type="submit"
              disabled={loading}
              className={
                s.submitButton +
                " " +
                s.cursorPointer +
                " " +
                (loading ? s.submitButtonDisabled : s.submitButtonEnabled)
              }
            >
              {loading ? "Adding..." : "Add Doctor to Team"}
            </button>
          </div>
        </form>
      </div>

      {/* TOAST */}
      {toast.show && (
        <div
          className={
            s.toastContainer +
            " " +
            (toast.type === "success" ? s.toastSuccess : s.toastError)
          }
        >
          {toast.type === "success" ? (
            <CheckCircle size={22} />
          ) : (
            <XCircle size={22} />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Simple overview of added doc */}
      <div className={s.doctorListContainer}>
        {doctorList.length ? (
          <div className={s.doctorListGrid}>
            {doctorList.map((d) => (
              <div key={d.id || d._id} className={s.doctorCard}>
                <div className={s.doctorCardContent}>
                  <img
                    src={s.imageUrl || d.imagePreview}
                    alt={d.name}
                    className={s.doctorImage}
                  />

                  <div>
                    <div className={s.doctorName}>{d.name}</div>
                    <div className={s.doctorSpecialization}>
                      {d.specialization}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={s.emptyState}>No doctors Yet</p>
        )}
      </div>
    </div>
  );
};

export default AddPage;
