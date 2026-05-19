import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Clock,
  FileText,
  IndianRupee,
  Send,
  Phone,
} from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import toast, { Toaster } from "react-hot-toast";
import { serviceDetailStyles, iconSize } from "../assets/dummyStyles";

const DEFAULT_HOST = "https://medicare-backend-t2oa.onrender.com".replace(/\/$/, "");

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Clerk
  const { isSignedIn, userId, getToken } = useAuth();

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");

  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Online");

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const isValidMobile = (m) => /^\d{10}$/.test(m);

  // Finite number greater than 0 and less than 150
  const isValidAge = (a) => {
    if (a === "" || a === null || a === undefined) return false;
    const n = Number(a);
    return Number.isInteger(n) && n > 0 && n < 150;
  };

  // Basic validations
  function getClientMissingFields() {
    const missing = [];
    if (!customerName || !customerName.trim()) missing.push("patientName");
    if (!mobile || !isValidMobile(mobile)) missing.push("mobile (10 digits)");
    if (!selectedDate) missing.push("date");
    if (!selectedTime) missing.push("time");

    if (!isValidAge(age)) missing.push("age (positive integer)");
    if (!gender || !String(gender).trim()) missing.push("gender");
    return missing;
  }

  // Check is form valid by all field are filled or not
  const isFormValid = () => getClientMissingFields().length === 0;

  // Fetch the services from the server
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const endpoints = [
      `${DEFAULT_HOST}/api/services/${encodeURIComponent(id)}`,
    ];

    async function tryFetch() {
      setLoading(true);
      setFetchError(null);

      let lastError = null;
      for (const url of endpoints) {
        try {
          const res = await fetch(url, {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            signal: controller.signal,
          });

          if (res.status === 404) {
            lastError = new Error(`404 ${url}`);
            continue;
          }

          const contentType = res.headers.get("content-type") || "";
          if (!res.ok || !contentType.includes("application/json")) {
            const txt = await res.text().catch(() => "");
            lastError = new Error(
              `Bad response ${res.status} at ${url}: ${String(txt).slice(
                0,
                200,
              )}`,
            );
            continue;
          }

          const json = await res.json().catch(() => null);
          const doc = json?.data ?? json?.service ?? json;

          if (!doc) {
            lastError = new Error(`No service data at ${url}`);
            continue;
          }

          const transformed = transformServiceShape(doc);

          if (!mounted) return;
          setService(transformed);
          if (transformed.dates && transformed.dates.length > 0) {
            setSelectedDate(transformed.dates[0]);
            setSelectedTime("");
          }
          setLoading(false);
          return;
        } catch (err) {
          if (err.name === "AbortError") return;
          lastError = err;
          continue;
        }
      }

      if (!mounted) return;
      console.warn(
        "All endpoints failed, falling back to local servicesData. Last error:",
        lastError,
      );
      const local =
        servicesData && servicesData.find((s) => String(s.id) === String(id));
      if (local) {
        const cloned = JSON.parse(JSON.stringify(local));
        if (
          !cloned.slots ||
          (Array.isArray(cloned.slots) &&
            cloned.dates &&
            cloned.dates.length > 0)
        ) {
          const arrSlots = Array.isArray(cloned.slots) ? cloned.slots : [];
          const slotsMap = {};
          if (cloned.dates && cloned.dates.length > 0) {
            cloned.dates.forEach((d) => (slotsMap[d] = arrSlots.slice()));
          } else {
            const today = new Date().toISOString().split("T")[0];
            slotsMap[today] = arrSlots.slice();
            cloned.dates = [today];
          }
          cloned.slots = slotsMap;
        }
        setService(cloned);
        if (cloned.dates && cloned.dates.length > 0)
          setSelectedDate(cloned.dates[0]);
        setLoading(false);
        return;
      }

      setFetchError("Unable to fetch service details from server.");
      setLoading(false);
    }

    tryFetch();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [id]);

  function normalizeToDateString(d) {
    // Convert anything date-like into YYYY-MM-DD string, or return null if invalid
    const dt = new Date(d);
    if (isNaN(dt)) return null;
    return dt.toISOString().split("T")[0];
  }

  function sortServiceDates(datesArr) {
    // Accepts array of mixed date strings / Date objects, returns array of unique YYYY-MM-DD strings
    if (!Array.isArray(datesArr)) return [];

    const uniq = Array.from(
      new Set(datesArr.map(normalizeToDateString).filter(Boolean)),
    );

    const parsed = uniq.map((ds) => ({ ds, date: new Date(ds) }));

    const dateVal = (d) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());

    const today = new Date();
    const todayVal = dateVal(today);

    const past = parsed
      .filter((p) => dateVal(p.date) < todayVal)
      .sort((a, b) => dateVal(b.date) - dateVal(a.date)); // nearest past first(descending order)

    const future = parsed
      .filter((p) => dateVal(p.date) >= todayVal)
      .sort((a, b) => dateVal(a.date) - dateVal(b.date)); // ascending order earliest future first (includes today)

    return [...past, ...future].map((p) => p.ds);
  }

  // Replace your transformServiceShape with this updated version:
  function transformServiceShape(doc) {
    const out = {};
    out.id =
      doc._id ??
      doc.id ??
      doc.slug ??
      String(doc.name).replace(/\s+/g, "-").toLowerCase();
    out.name = doc.name ?? doc.title ?? "Service";
    out.image =
      doc.image || doc.imageUrl || doc.imageURL || doc.image_path || null;
    out.price =
      typeof doc.price === "number" ? doc.price : Number(doc.price) || 0;
    out.about = doc.about ?? doc.description ?? doc.shortDescription ?? "";
    out.instructions = Array.isArray(doc.instructions) ? doc.instructions : [];

    let dates = Array.isArray(doc.dates) ? doc.dates.slice() : [];
    let slotsMap = {};
    if (
      doc.slots &&
      !Array.isArray(doc.slots) &&
      typeof doc.slots === "object"
    ) {
      slotsMap = { ...doc.slots };
      if (dates.length === 0) dates = Object.keys(slotsMap);
    } else if (Array.isArray(doc.slots)) {
      const arr = doc.slots.slice();
      if (dates.length > 0) {
        dates.forEach((d) => (slotsMap[d] = arr.slice()));
      } else {
        const today = new Date().toISOString().split("T")[0];
        slotsMap[today] = arr.slice();
        dates = [today];
      }
    } else {
      if (dates.length > 0) {
        dates.forEach((d) => (slotsMap[d] = []));
      } else {
        const today = new Date().toISOString().split("T")[0];
        dates = [today];
        slotsMap[today] = [];
      }
    }

    // Ensure dates normalized and ordered: past-first (nearest → older), then today+future (earliest → latest)
    out.dates = sortServiceDates(dates);
    out.slots = slotsMap;
    out.imageAlt = doc.imageAlt ?? doc.alt ?? out.name;
    out.raw = doc;
    return out;
  }

  // To submit the data to server
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmitError(null);
    setSuccessMessage(null);

    // basic validations
    const missing = getClientMissingFields();
    if (missing.length > 0) {
      setSubmitError(
        `${missing.join(", ")} ${missing.length > 1 ? "are" : "is"} required`,
      );
      return;
    }

    if (!service) {
      setSubmitError("Service details not loaded");
      return;
    }

    if (!isSignedIn) {
      toast.error("Please sign in to create a booking.");
      return;
    }

    setSubmitting(true);
    try {
      // get Clerk token (frontend)
      const token = await getToken().catch(() => null);

      // payload (replace the existing payload in ServiceDetail.jsx)
      const payload = {
        serviceId:
          (service?.raw && (service.raw._id || service.raw.id)) || service?.id,
        serviceName: service?.name || "",
        // NEW: service image snapshot hints (backend will prefer DB but accepts these)
        serviceImageUrl:
          (service?.raw &&
            (service.raw.imageUrl ||
              service.raw.image ||
              service.raw.imageURL ||
              "")) ||
          service?.image ||
          "" ||
          "",
        serviceImagePublicId:
          (service?.raw &&
            (service.raw.imagePublicId ||
              (service.raw.image && service.raw.image.publicId) ||
              "")) ||
          "",
        patientName: customerName.trim(),
        mobile: mobile.trim(),
        age: age ? Number(age) : undefined,
        gender: gender || "",
        date: selectedDate,
        time: selectedTime,
        fee: service?.price ?? 0,
        fees: service?.price ?? 0,
        paymentMethod: paymentMethod === "Cash" ? "Cash" : "Online",
        email: email || undefined,
        meta: {
          client: "frontend",
          serviceName: service?.name,
        },
      };

      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      } else {
        toast.error(
          "Authentication token not available. Please sign in again.",
        );
        setSubmitting(false);
        return;
      }

      const res = await fetch(`${DEFAULT_HOST}/api/service-appointments`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let json = null;
      try {
        json = JSON.parse(text);
      } catch {
        json = { rawText: text };
      }

      if (!res.ok) {
        const msg =
          (json && (json.message || json.error || json.rawText)) ||
          `Server returned ${res.status}`;
        if (json && json.errors && typeof json.errors === "object") {
          const ve = Array.isArray(json.errors)
            ? json.errors.join(", ")
            : JSON.stringify(json.errors);
          setSubmitError(`${msg} — ${ve}`);
        } else {
          setSubmitError(String(msg));
        }
        setSubmitting(false);
        return;
      }

      const { appointment, checkoutUrl } = json || {};

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }

      toast.success(
        "Booking created successfully. Redirecting to appointments...",
      );
      setTimeout(() => {
        navigate("/appointments?payment_status=Paid", { replace: true });
      }, 700);

      // reset the form
      setCustomerName("");
      setMobile("");
      setAge("");
      setGender("");
      setSelectedDate("");
      setSelectedTime("");
      setEmail("");
    } catch (err) {
      console.error("Booking submit error:", err);
      setSubmitError("Network error while creating booking.");
    } finally {
      setSubmitting(false);
    }
  };

  // if its in loading state
  if (loading) {
    return (
      <div className={serviceDetailStyles.loadingContainer}>
        <div className={serviceDetailStyles.loadingCard}>
          <h2 className={serviceDetailStyles.loadingTitle}>
            Loading service...
          </h2>
          <p className={serviceDetailStyles.loadingText}>
            Fetching details from server
          </p>
        </div>
      </div>
    );
  }

  // if there is not service found in the DB
  if (!service) {
    return (
      <div className={serviceDetailStyles.loadingContainer}>
        <div className={serviceDetailStyles.loadingCard}>
          <h2 className={serviceDetailStyles.loadingTitle}>
            Service not found
          </h2>
          <p className={serviceDetailStyles.loadingText}>
            Please go back and select a valid service.
          </p>
          <Link to="/services" className={serviceDetailStyles.backToServices}>
            Back to Services
          </Link>
        </div>
      </div>
    );
  }

  // rest is the UI part
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fbff] to-[#eef7ff] overflow-hidden">
      <Toaster />

      {/* Background Blur */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-100/40 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-cyan-100/40 rounded-full blur-3xl"></div>

      {/* NAVBAR */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-4 flex items-center justify-between gap-4">

          <Link
            to="/services"
            className="
        group
        inline-flex items-center gap-2
        px-4 py-2.5
        rounded-2xl
        bg-white
        border border-slate-200
        shadow-sm
        text-slate-700
        font-semibold
        hover:bg-white
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

            <span className="text-sm sm:text-base">
              Back
            </span>
          </Link>

          <div className="flex-1 text-center">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                Service Description
              </span>
            </h1>
          </div>

          {/* Spacer for center alignment */}
          <div className="w-[110px] hidden sm:block"></div>

        </div>
      </div>

      {/* CONTENT */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">

          {/* ================= LEFT ================= */}
          <div className="space-y-8">

            {/* IMAGE CARD */}
            <div className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-[32px] p-5 sm:p-8 shadow-sm">
              <div className="flex flex-col items-center text-center">

                {/* Circle Image */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-cyan-400 blur-2xl opacity-20 rounded-full"></div>

                  <img
                    src={service.image || "/placeholder-service.png"}
                    alt={service.name}
                    className="
                    relative
                    w-40 h-40
                    sm:w-52 sm:h-52
                    lg:w-64 lg:h-64
                    rounded-full
                    object-cover
                    border-[6px]
                    border-white
                    shadow-2xl
                  "
                  />
                </div>

                <h1 className="mt-6 text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
                  {service.name}
                </h1>

                <div className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-emerald-50 text-emerald-700 font-semibold">
                  <IndianRupee size={18} />
                  ₹{service.price}
                </div>
              </div>
            </div>

            {/* FORM CARD */}
            <div className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-[32px] p-5 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <Phone className="text-emerald-500" size={22} />
                <h2 className="text-2xl font-black text-slate-900">
                  Your Details
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">

                <input
                  required
                  type="text"
                  placeholder="Full Name *"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="
                  w-full rounded-2xl border border-slate-200
                  bg-white px-4 py-4 text-slate-700
                  outline-none focus:ring-2 focus:ring-emerald-400
                "
                />

                <input
                  type="text"
                  required
                  placeholder="Mobile Number *"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) =>
                    setMobile(e.target.value.replace(/\D/g, ""))
                  }
                  className={`
                  w-full rounded-2xl border px-4 py-4
                  outline-none transition-all duration-300
                  ${mobile && !isValidMobile(mobile)
                      ? "border-red-400 focus:ring-2 focus:ring-red-300"
                      : "border-slate-200 focus:ring-2 focus:ring-emerald-400"
                    }
                `}
                />

                <input
                  type="number"
                  required
                  placeholder="Age *"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="
                  w-full rounded-2xl border border-slate-200
                  bg-white px-4 py-4 text-slate-700
                  outline-none focus:ring-2 focus:ring-emerald-400
                "
                />

                <select
                  value={gender}
                  required
                  onChange={(e) => setGender(e.target.value)}
                  className="
                  w-full rounded-2xl border border-slate-200
                  bg-white px-4 py-4 text-slate-700
                  outline-none focus:ring-2 focus:ring-emerald-400
                "
                >
                  <option value="">Select Gender *</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>

                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="
                  sm:col-span-2
                  w-full rounded-2xl border border-slate-200
                  bg-white px-4 py-4 text-slate-700
                  outline-none focus:ring-2 focus:ring-emerald-400
                "
                />
              </div>

              {/* PAYMENT */}
              <div className="mt-8">
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  Payment Method
                </h3>

                <div className="flex flex-wrap gap-4">
                  {["Cash", "Online"].map((method) => (
                    <label
                      key={method}
                      className={`
                      flex items-center gap-3 px-5 py-3 rounded-2xl border cursor-pointer transition-all duration-300
                      ${paymentMethod === method
                          ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white border-transparent shadow-lg"
                          : "bg-white border-slate-200 text-slate-700"
                        }
                    `}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method}
                        checked={paymentMethod === method}
                        onChange={() => setPaymentMethod(method)}
                        className="hidden"
                      />
                      {method}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* DATE */}
            <div className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-[32px] p-5 sm:p-8 shadow-sm">
              <h2 className="text-2xl font-black text-slate-900 mb-6">
                Select Date
              </h2>

              <div className="flex gap-4 overflow-x-auto pb-2">
                {service.dates.map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setSelectedDate(d);
                      setSelectedTime("");
                    }}
                    className={`
                    min-w-[110px]
                    px-5 py-4 rounded-2xl font-semibold transition-all duration-300
                    ${selectedDate === d
                        ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg"
                        : "bg-white border border-slate-200 text-slate-700 hover:border-emerald-300"
                      }
                  `}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* TIME */}
            {selectedDate && (
              <div className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-[32px] p-5 sm:p-8 shadow-sm">
                <h2 className="text-2xl font-black text-slate-900 mb-6">
                  Select Time
                </h2>

                <div className="flex flex-wrap gap-4">
                  {(service.slots[selectedDate] || []).map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTime(t)}
                      className={`
                      inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold transition-all duration-300
                      ${selectedTime === t
                          ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg"
                          : "bg-white border border-slate-200 text-slate-700"
                        }
                    `}
                    >
                      <Clock size={18} />
                      {t}
                    </button>
                  ))}
                </div>

                {(!service.slots[selectedDate] ||
                  service.slots[selectedDate].length === 0) && (
                    <div className="mt-4 text-slate-500">
                      No slots available for this date.
                    </div>
                  )}
              </div>
            )}

            {/* ERROR / SUCCESS */}
            {submitError && (
              <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-red-600 font-medium">
                {submitError}
              </div>
            )}

            {successMessage && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-600 font-medium">
                {successMessage}
              </div>
            )}

            {/* SUBMIT */}
            <button
              disabled={!isFormValid() || submitting}
              onClick={handleSubmit}
              className={`
              w-full inline-flex items-center justify-center gap-3
              py-4 rounded-2xl text-lg font-bold transition-all duration-300
              ${isFormValid() && !submitting
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:shadow-2xl hover:-translate-y-1"
                  : "bg-slate-200 text-slate-500 cursor-not-allowed"
                }
            `}
            >
              <Send size={20} />

              {submitting
                ? "Submitting..."
                : `Confirm Booking ${service.price ? `• ₹${service.price}` : ""
                }`}
            </button>
          </div>

          {/* ================= RIGHT ================= */}
          <div className="space-y-8">

            {/* ABOUT */}
            <div className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-[32px] p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <FileText className="text-cyan-500" />
                <h2 className="text-2xl font-black text-slate-900">
                  About This Service
                </h2>
              </div>

              <p className="text-slate-600 leading-relaxed text-base sm:text-lg">
                {service.about}
              </p>
            </div>

            {/* INSTRUCTIONS */}
            <div className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-[32px] p-6 sm:p-8 shadow-sm">
              <h3 className="text-2xl font-black text-slate-900 mb-5">
                Pre-Test Instructions
              </h3>

              <ul className="space-y-4">
                {service.instructions.map((i, idx) => (
                  <li
                    key={idx}
                    className="flex gap-3 text-slate-600 leading-relaxed"
                  >
                    <span className="mt-2 w-2 h-2 rounded-full bg-emerald-500"></span>
                    {i}
                  </li>
                ))}
              </ul>
            </div>

            {/* SUMMARY */}
            <div className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-[32px] p-6 sm:p-8 shadow-sm sticky top-24">
              <h3 className="text-2xl font-black text-slate-900 mb-6">
                Booking Summary
              </h3>

              <div className="space-y-4">
                {[
                  ["Name", customerName || "Not filled"],
                  ["Mobile", mobile || "Not filled"],
                  ["Age", age || "Not filled"],
                  ["Gender", gender || "Not filled"],
                  ["Date", selectedDate || "Not selected"],
                  ["Time", selectedTime || "Not selected"],
                  ["Payment", paymentMethod],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3"
                  >
                    <span className="text-slate-500 font-medium">
                      {label}
                    </span>

                    <span className="font-semibold text-slate-900 text-right">
                      {value}
                    </span>
                  </div>
                ))}

                <div className="flex items-center justify-between pt-4">
                  <span className="text-lg font-bold text-slate-900">
                    Total Price
                  </span>

                  <span className="text-2xl font-black bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                    ₹{service.price}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
