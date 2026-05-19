import React, { useMemo, useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  CalendarCheck,
  MapPin,
  BadgeInfo,
  GraduationCap,
  Award,
  Clock,
  Star,
  Heart,
  Zap,
  Shield,
  Users,
  Phone,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Clerk client hooks
import { useAuth, useUser } from "@clerk/clerk-react";
import { doctorDetailStyles } from "../assets/dummyStyles";

const API_BASE = "https://medicare-backend-t2oa.onrender.com";

// This function will parse date into an obj
function getScheduleDates(schedule) {
  if (!schedule) return [];
  // supporting YYYY-MM-DD
  const keys =
    typeof schedule === "object" && !Array.isArray(schedule)
      ? Object.keys(schedule)
      : [];

  // Parse keys into Date objects (supporting YYYY-MM-DD and ISO)
  const parsed = keys
    .map((k) => {
      const d = new Date(k);
      if (!isNaN(d)) return { key: k, date: d };

      // fallback: try splitting YYYY-MM-DD
      const parts = k.split("-").map((n) => Number(n));
      if (parts.length >= 3) {
        const [y, m, day] = parts;
        const dd = new Date(y, m - 1, day);
        if (!isNaN(dd)) return { key: k, date: dd };
      }
      return null;
    })
    .filter(Boolean);

  // Normalize compare by date-only (use UTC to avoid timezone time-of-day issues)
  const dateOnlyValue = (d) =>
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());

  const today = new Date();
  const todayVal = dateOnlyValue(today);

  const past = parsed
    .filter((p) => dateOnlyValue(p.date) < todayVal)
    .sort(
      (a, b) =>
        // most recent past first (descending)
        dateOnlyValue(b.date) - dateOnlyValue(a.date),
    );

  const future = parsed
    .filter((p) => dateOnlyValue(p.date) >= todayVal)
    .sort(
      (a, b) =>
        // earliest first (ascending)
        dateOnlyValue(a.date) - dateOnlyValue(b.date),
    );

  // Return array of Date objects in desired order
  return [...past, ...future].map((p) => p.date);
}

/**
 * Normalize phone string: remove non-digits and return up to last 10 digits.
 * Returns empty string if no digits.
 */
function normalizePhoneTo10(phone) {
  if (!phone) return "";
  const digits = ("" + phone).replace(/\D/g, "");
  if (!digits) return "";
  // prefer last 10 digits (common when country code present)
  return digits.length <= 10 ? digits : digits.slice(-10);
}

export default function DoctorDetail() {
  const { id } = useParams();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    mobile: "",
    gender: "",
    email: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clerk hooks
  const { getToken, isLoaded: authLoaded } = useAuth();
  const { isSignedIn, user, isLoaded: userLoaded } = useUser();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Prefill the form fields quietly if user is available (no UI markup change)
  useEffect(() => {
    if (!userLoaded) return;
    if (user) {
      const fullName =
        user.fullName ||
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        "";
      const rawPhone =
        user.primaryPhone ||
        (user.phoneNumbers && user.phoneNumbers.length > 0
          ? user.phoneNumbers[0]
          : "") ||
        "";
      const phone = normalizePhoneTo10(rawPhone);
      const email =
        (user.emailAddresses && user.emailAddresses[0]?.emailAddress) ||
        user.primaryEmailAddress ||
        "";

      setFormData((prev) => ({
        ...prev,
        name: prev.name || fullName,
        mobile: prev.mobile || phone,
        email: prev.email || email,
      }));
    }
  }, [userLoaded, user]);

  useEffect(() => {
    let mounted = true;
    async function fetchDoctor() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/doctors/${id}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            body.message || `Failed to fetch (status ${res.status})`,
          );
        }
        const payload = await res.json();
        const doc = payload?.data || null;
        if (mounted) setDoctor(doc);
      } catch (err) {
        if (mounted) setError(err.message || "Failed to fetch doctor");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchDoctor();
    return () => {
      mounted = false;
    };
  }, [id]);

  const next7 = useMemo(() => getScheduleDates(doctor?.schedule), [doctor]);
  const fee = Number(doctor?.fee ?? doctor?.fees ?? 0);

  const slots = useMemo(() => {
    if (!selectedDate || !doctor?.schedule) return [];
    const key = selectedDate.toISOString().split("T")[0];
    return doctor.schedule && doctor.schedule[key] ? doctor.schedule[key] : [];
  }, [selectedDate, doctor]);

  // Mobile input handlers: only digits, max 10
  const handleMobileChange = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    setFormData((prev) => ({ ...prev, mobile: digits }));
  };

  const handleMobilePaste = (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData("text");
    const digits = pasted.replace(/\D/g, "").slice(0, 10);
    setFormData((prev) => ({ ...prev, mobile: digits }));
  };

  const handleBooking = async () => {
    if (isSubmitting) return;

    // Validate patient details
    if (
      !formData.name ||
      !formData.age ||
      !formData.mobile ||
      !formData.gender
    ) {
      toast.error("Please fill all patient details!", {
        position: "top-center",
        autoClose: 2000,
      });
      return;
    }

    // Mobile must be exactly 10 digits
    const mobileDigits = (formData.mobile || "").replace(/\D/g, "");
    if (mobileDigits.length !== 10) {
      toast.error("Mobile number must be exactly 10 digits.", {
        position: "top-center",
        autoClose: 2500,
      });
      return;
    }

    if (!selectedDate || !selectedSlot) {
      toast.error("Please select a date and time slot", {
        position: "top-center",
        autoClose: 2000,
      });
      return;
    }

    if (!authLoaded || !userLoaded) {
      toast.error("Authentication not ready. Please try again in a moment.", {
        position: "top-center",
        autoClose: 2000,
      });
      return;
    }

    if (!isSignedIn) {
      toast.error("You must sign in to create an appointment.", {
        position: "top-center",
        autoClose: 2200,
      });
      return;
    }

    setIsSubmitting(true);

    const dateISO = selectedDate.toISOString().split("T")[0]; // YYYY-MM-DD

    // prefer fields from doctor object (this is only sent as a hint; backend will use DB)
    const doctorNameValue = doctor?.name || "";
    const specialityValue =
      doctor?.specialization ||
      doctor?.speciality ||
      doctor?.specialityName ||
      "";

    // optional owner from doctor object (backend will prefer doctor.owner)
    const ownerValue = doctor?.owner || undefined;

    const payload = {
      doctorId: doctor._id || doctor.id,
      doctorName: doctorNameValue,
      speciality: specialityValue,
      owner: ownerValue,
      // NEW: send image hints (optional — backend prefers DB but accepts these)
      doctorImageUrl: doctor?.imageUrl || doctor?.image || "",
      doctorImagePublicId:
        doctor?.imagePublicId || doctor?.image?.publicId || "",
      patientName: formData.name,
      mobile: mobileDigits,
      age: formData.age,
      gender: formData.gender,
      date: dateISO,
      time: selectedSlot,
      fee: fee,
      fees: fee,
      paymentMethod: paymentMethod || "Online",
      email: formData.email || undefined,
    };

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Failed to obtain authentication token.");
      }

      const res = await fetch(`${API_BASE}/api/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const message =
          body?.message || body?.error || `Booking failed (${res.status})`;
        toast.error(message, { position: "top-center" });
        setIsSubmitting(false);
        return;
      }

      // If checkoutUrl is returned -> redirect to Stripe Checkout
      if (body.checkoutUrl) {
        // redirect user to Stripe Checkout
        window.location.href = body.checkoutUrl;
        return;
      }

      // Booking created (Cash or free)
      toast.success("Booking successful", {
        position: "top-center",
        autoClose: 1500,
      });

      // navigate to appointments list (you can change this path)
      setTimeout(() => {
        window.location.href = "/appointments?payment_status=Pending";
      }, 700);
    } catch (err) {
      console.error("Booking error:", err);
      toast.error(
        err?.message || "Network error - booking failed (auth or server issue)",
        { position: "top-center" },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className={doctorDetailStyles.loadingContainer}>
        <div>Loading doctor...</div>
      </div>
    );

  if (error)
    return (
      <div className={doctorDetailStyles.errorContainer}>
        <div className={doctorDetailStyles.errorContent}>
          <div className={doctorDetailStyles.errorText}>Error</div>
          <div className={doctorDetailStyles.errorMessage}>{error}</div>
          <Link to="/doctors" className={doctorDetailStyles.backButton}>
            <ArrowLeft size={20} />
            Back to Doctors
          </Link>
        </div>
      </div>
    );

  if (!doctor)
    return (
      <div className={doctorDetailStyles.notFoundContainer}>
        <div className={doctorDetailStyles.notFoundContent}>
          <div className={doctorDetailStyles.notFoundEmoji}>😷</div>
          <h1 className={doctorDetailStyles.notFoundTitle}>Doctor Not Found</h1>
          <Link to="/doctors" className={doctorDetailStyles.backButton}>
            <ArrowLeft size={20} />
            Back to Doctors
          </Link>
        </div>
      </div>
    );

  return (
    <section className="relative overflow-hidden min-h-screen bg-gradient-to-b from-[#f8fbff] via-white to-[#eef7ff] py-6 pb-24">
      <ToastContainer />

      {/* Background Blur */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-100/40 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-cyan-100/40 rounded-full blur-3xl"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap mb-10">

          <Link
            to="/doctors"
            className="
      group
      inline-flex items-center gap-2
      px-4 py-2.5
      rounded-2xl
      bg-white
      border border-slate-200
      text-slate-700
      font-semibold
      shadow-sm
      hover:text-emerald-600
      hover:border-emerald-300
      hover:shadow-lg
      hover:-translate-y-0.5
      transition-all duration-300
    "
          >
            <ArrowLeft
              size={18}
              className="transition-transform duration-300 group-hover:-translate-x-1"
            />
            Back
          </Link>

          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                Doctor Profile
              </span>
            </h1>
          </div>



          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="font-bold text-slate-800">
              {doctor.rating}
            </span>
          </div>
        </div>

        <div
          className={`transition-all duration-700 ${isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10"
            }`}
        >
          {/* PROFILE CARD */}
          <div className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-[32px] shadow-sm p-5 sm:p-8 lg:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
              {/* LEFT */}
              <div className="flex flex-col items-center">
                {/* IMAGE */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-cyan-400 blur-3xl opacity-20 rounded-full"></div>

                  <div className="relative w-52 h-52 sm:w-64 sm:h-64 rounded-full overflow-hidden border-[6px] border-white shadow-2xl">
                    <img
                      src={
                        doctor.imageUrl ||
                        doctor.image ||
                        "/placeholder-doctor.jpg"
                      }
                      alt={doctor.name}
                      className="w-full h-full object-cover"
                      style={{ objectPosition: "center top" }}
                    />
                  </div>
                </div>

                {/* STATS */}
                <div className="grid grid-cols-3 gap-3 sm:gap-5 w-full mt-8">
                  <div className="bg-white rounded-3xl border border-slate-200 p-4 text-center shadow-sm">
                    <Heart className="w-5 h-5 text-red-500 mx-auto mb-2" />
                    <div className="text-lg sm:text-xl font-black text-slate-900">
                      {doctor.success}%
                    </div>
                    <div className="text-xs sm:text-sm text-slate-500 font-medium">
                      Success
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200 p-4 text-center shadow-sm">
                    <Award className="w-5 h-5 text-yellow-500 mx-auto mb-2" />
                    <div className="text-lg sm:text-xl font-black text-slate-900">
                      {doctor.experience}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-500 font-medium">
                      Experience
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200 p-4 text-center shadow-sm">
                    <Users className="w-5 h-5 text-cyan-500 mx-auto mb-2" />
                    <div className="text-lg sm:text-xl font-black text-slate-900">
                      {doctor.patients}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-500 font-medium">
                      Patients
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="space-y-7">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
                    {doctor.name}
                  </h1>

                  <div className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold shadow-lg">
                    <Zap className="w-4 h-4" />
                    {doctor.specialization ||
                      doctor.speciality}
                  </div>
                </div>

                {/* INFO GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
                    <GraduationCap className="w-6 h-6 text-emerald-500 mb-3" />

                    <p className="text-sm text-slate-500 font-medium">
                      Qualifications
                    </p>

                    <h3 className="text-slate-900 font-bold mt-1">
                      {doctor.qualifications}
                    </h3>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
                    <MapPin className="w-6 h-6 text-cyan-500 mb-3" />

                    <p className="text-sm text-slate-500 font-medium">
                      Location
                    </p>

                    <h3 className="text-slate-900 font-bold mt-1">
                      {doctor.location}
                    </h3>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
                    <Clock className="w-6 h-6 text-orange-500 mb-3" />

                    <p className="text-sm text-slate-500 font-medium">
                      Consultation Fee
                    </p>

                    <h3 className="text-2xl font-black text-slate-900 mt-1">
                      ₹{fee}
                    </h3>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
                    <Shield className="w-6 h-6 text-green-500 mb-3" />

                    <p className="text-sm text-slate-500 font-medium">
                      Availability
                    </p>

                    <h3 className="text-slate-900 font-bold mt-1">
                      {doctor.availability === "Available" ||
                        doctor.available
                        ? "Available"
                        : "Available Soon"}
                    </h3>
                  </div>
                </div>

                {/* ABOUT */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <BadgeInfo className="w-5 h-5 text-emerald-500" />

                    <h3 className="text-xl font-bold text-slate-900">
                      About Doctor
                    </h3>
                  </div>

                  <p className="text-slate-600 leading-relaxed">
                    {doctor.about || doctor.bio}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* APPOINTMENT SECTION */}
          <div className="mt-10 bg-white/70 backdrop-blur-xl border border-slate-200 rounded-[32px] shadow-sm p-5 sm:p-8 lg:p-10">
            {/* TITLE */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg">
                <CalendarCheck className="w-6 h-6 text-white" />
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                  Book Your Appointment
                </h2>

                <p className="text-slate-500 mt-1">
                  Select date and available slot
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* LEFT */}
              <div>
                {/* DATE */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-2">
                    <CalendarCheck className="w-5 h-5 text-emerald-500" />
                    Select Date
                  </h3>

                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {next7.map((date) => {
                      const isSelected =
                        selectedDate?.toDateString() ===
                        date.toDateString();

                      return (
                        <button
                          key={date.toISOString()}
                          onClick={() =>
                            setSelectedDate(date)
                          }
                          className={`min-w-[90px] rounded-3xl p-4 border transition-all duration-300 ${isSelected
                            ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white border-transparent shadow-lg scale-105"
                            : "bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:shadow-md"
                            }`}
                        >
                          <div className="text-sm font-semibold">
                            {date.toLocaleDateString(
                              "en-US",
                              {
                                weekday: "short",
                              }
                            )}
                          </div>

                          <div className="text-2xl font-black mt-1">
                            {date.getDate()}
                          </div>

                          <div className="text-xs mt-1">
                            {date.toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                              }
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* FORM */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-xl font-bold text-slate-900 mb-5">
                    Patient Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Full Name"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-400"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          name: e.target.value,
                        })
                      }
                    />

                    <input
                      type="number"
                      placeholder="Age"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-400"
                      value={formData.age}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          age: e.target.value,
                        })
                      }
                    />

                    <input
                      type="tel"
                      placeholder="Mobile Number"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-400"
                      value={formData.mobile}
                      onChange={(e) =>
                        handleMobileChange(
                          e.target.value
                        )
                      }
                    />

                    <select
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-400"
                      value={formData.gender}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          gender: e.target.value,
                        })
                      }
                    >
                      <option value="">
                        Gender
                      </option>
                      <option value="Male">
                        Male
                      </option>
                      <option value="Female">
                        Female
                      </option>
                      <option value="Other">
                        Other
                      </option>
                    </select>

                    <input
                      type="email"
                      placeholder="Email (optional)"
                      className="sm:col-span-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-400"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div>
                {/* TIME SLOTS */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-cyan-500" />
                    Available Time Slots
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {slots.length === 0 && (
                      <p className="text-slate-500">
                        No slots available
                      </p>
                    )}

                    {slots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() =>
                          setSelectedSlot(slot)
                        }
                        className={`rounded-2xl py-3 px-3 font-semibold transition-all duration-300 ${selectedSlot === slot
                          ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SUMMARY */}
                <div className="mt-6 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-xl font-bold text-slate-900 mb-5">
                    Booking Summary
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500">
                        Doctor
                      </span>

                      <span className="font-bold text-slate-900 text-right">
                        {doctor?.name || "—"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500">
                        Speciality
                      </span>

                      <span className="font-bold text-slate-900 text-right">
                        {doctor?.specialization ||
                          doctor?.speciality ||
                          "—"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500">
                        Date
                      </span>

                      <span className="font-bold text-slate-900 text-right">
                        {selectedDate
                          ? selectedDate.toLocaleDateString()
                          : "Not selected"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500">
                        Time
                      </span>

                      <span className="font-bold text-slate-900 text-right">
                        {selectedSlot ||
                          "Not selected"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-4">
                      <span className="text-slate-500">
                        Consultation Fee
                      </span>

                      <span className="text-2xl font-black text-slate-900">
                        ₹{fee}
                      </span>
                    </div>
                  </div>

                  {/* PAYMENT */}
                  <div className="mt-6">
                    <label className="text-slate-700 font-semibold mb-3 block">
                      Payment Method
                    </label>

                    <div className="flex gap-3">
                      <label
                        className={`flex-1 rounded-2xl border px-4 py-3 text-center font-semibold cursor-pointer transition-all duration-300 ${paymentMethod === "Cash"
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value="Cash"
                          checked={
                            paymentMethod ===
                            "Cash"
                          }
                          onChange={() =>
                            setPaymentMethod(
                              "Cash"
                            )
                          }
                          className="hidden"
                        />

                        Cash
                      </label>

                      <label
                        className={`flex-1 rounded-2xl border px-4 py-3 text-center font-semibold cursor-pointer transition-all duration-300 ${paymentMethod ===
                          "Online"
                          ? "bg-cyan-500 text-white border-cyan-500"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value="Online"
                          checked={
                            paymentMethod ===
                            "Online"
                          }
                          onChange={() =>
                            setPaymentMethod(
                              "Online"
                            )
                          }
                          className="hidden"
                        />

                        Online
                      </label>
                    </div>
                  </div>

                  {/* BUTTON */}
                  <button
                    onClick={handleBooking}
                    disabled={
                      !selectedDate ||
                      !selectedSlot ||
                      isSubmitting
                    }
                    className={`w-full mt-7 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${!selectedDate ||
                      !selectedSlot ||
                      isSubmitting
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg hover:shadow-2xl hover:-translate-y-1"
                      }`}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <Phone className="w-5 h-5" />

                      <span>
                        {isSubmitting
                          ? "Booking..."
                          : "Confirm Booking"}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
