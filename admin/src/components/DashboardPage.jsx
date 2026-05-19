import React, { useEffect, useMemo, useState } from "react";
import {
  BadgeIndianRupee,
  CalendarRange,
  CheckCircle,
  Search,
  UserRoundCheck,
  Users,
  XCircle,
  Activity,
  Stethoscope,
} from "lucide-react";

const API_BASE = "https://medicare-backend-t2oa.onrender.com";
const PATIENT_COUNT_API = `${API_BASE}/api/appointments/patients/count`;

const safeNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

function normalizeDoctor(doc) {
  const id = doc._id || doc.id || String(Math.random()).slice(2);

  const name =
    doc.name ||
    doc.fullName ||
    `${doc.firstName || ""} ${doc.lastName || ""}`.trim() ||
    "Unknown";

  const specialization =
    doc.specialization ||
    doc.speciality ||
    (Array.isArray(doc.specializations)
      ? doc.specializations.join(", ")
      : "") ||
    "General";

  const fee = safeNumber(
    doc.fee ?? doc.fees ?? doc.consultationFee ?? 0,
    0
  );

  const image =
    doc.imageUrl ||
    doc.image ||
    doc.avatar ||
    `https://i.pravatar.cc/150?u=${id}`;

  const appointments = {
    total:
      doc.appointments?.total ??
      doc.totalAppointments ??
      doc.appointmentsTotal ??
      0,

    completed:
      doc.appointments?.completed ??
      doc.completedAppointments ??
      0,

    canceled:
      doc.appointments?.canceled ??
      doc.canceledAppointments ??
      0,
  };

  let earnings = 0;

  if (doc.earnings !== undefined)
    earnings = safeNumber(doc.earnings, 0);
  else if (appointments.completed && fee)
    earnings = fee * safeNumber(appointments.completed, 0);

  return {
    id,
    name,
    specialization,
    fee,
    image,
    appointments,
    earnings,
    raw: doc,
  };
}

const DashboardPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [patientCount, setPatientCount] = useState(null);
  const [patientCountLoading, setPatientCountLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadDoctors() {
      setLoading(true);

      try {
        const res = await fetch(`${API_BASE}/api/doctors?limit=200`);

        if (!res.ok) throw new Error("Failed to fetch doctors");

        const body = await res.json();

        let list = [];

        if (Array.isArray(body)) list = body;
        else if (Array.isArray(body.doctors)) list = body.doctors;
        else if (Array.isArray(body.data)) list = body.data;

        const normalized = list.map((d) => normalizeDoctor(d));

        if (mounted) setDoctors(normalized);
      } catch (err) {
        console.error(err);
        if (mounted) setDoctors([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDoctors();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadPatientCount() {
      setPatientCountLoading(true);

      try {
        const res = await fetch(PATIENT_COUNT_API);

        if (!res.ok) {
          if (mounted) setPatientCount(0);
          return;
        }

        const body = await res.json();

        const count = Number(
          body?.count ?? body?.totalUsers ?? body?.data ?? 0
        );

        if (mounted) setPatientCount(isNaN(count) ? 0 : count);
      } catch (err) {
        console.error(err);

        if (mounted) setPatientCount(0);
      } finally {
        if (mounted) setPatientCountLoading(false);
      }
    }

    loadPatientCount();

    return () => {
      mounted = false;
    };
  }, []);

  const totals = useMemo(() => {
    const totalDoctors = doctors.length;

    const totalAppointments = doctors.reduce(
      (s, d) => s + safeNumber(d.appointments?.total, 0),
      0
    );

    const totalEarnings = doctors.reduce(
      (s, d) => s + safeNumber(d.earnings, 0),
      0
    );

    const completed = doctors.reduce(
      (s, d) => s + safeNumber(d.appointments?.completed, 0),
      0
    );

    const canceled = doctors.reduce(
      (s, d) => s + safeNumber(d.appointments?.canceled, 0),
      0
    );

    return {
      totalDoctors,
      totalAppointments,
      totalEarnings,
      completed,
      canceled,
    };
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    if (!query) return doctors;

    const q = query.toLowerCase();

    return doctors.filter((d) => {
      if (d.name.toLowerCase().includes(q)) return true;

      if ((d.specialization || "").toLowerCase().includes(q))
        return true;

      if (d.fee.toString().includes(q)) return true;

      return false;
    });
  }, [doctors, query]);

  const INITIAL_COUNT = 8;

  const visibleDoctors = showAll
    ? filteredDoctors
    : filteredDoctors.slice(0, INITIAL_COUNT);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-7xl mx-auto">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-[2rem] border border-emerald-100 bg-white/80 backdrop-blur-xl shadow-xl p-6 sm:p-8 mb-8">
          <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-100 rounded-full blur-3xl opacity-40" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold mb-4">
                <Activity size={16} />
                Admin Dashboard
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-slate-800 leading-tight">
                Hospital Management
                <span className="block bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                  Dashboard Overview
                </span>
              </h1>

              <p className="mt-4 text-slate-600 max-w-2xl text-sm sm:text-base leading-relaxed">
                Monitor doctors, appointments, earnings, and patient
                activity in one centralized admin dashboard.
              </p>
            </div>

            <div className="hidden lg:flex items-center justify-center">
              <div className="w-44 h-44 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center shadow-2xl">
                <Stethoscope size={80} className="text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="Total Doctors"
            value={totals.totalDoctors}
          />

          <StatCard
            icon={<UserRoundCheck className="w-6 h-6" />}
            label="Registered Users"
            value={
              patientCountLoading
                ? "Loading..."
                : patientCount ?? 0
            }
          />

          <StatCard
            icon={<CalendarRange className="w-6 h-6" />}
            label="Appointments"
            value={totals.totalAppointments}
          />

          <StatCard
            icon={<BadgeIndianRupee className="w-6 h-6" />}
            label="Total Earnings"
            value={`₹ ${totals.totalEarnings.toLocaleString()}`}
          />

          <StatCard
            icon={<CheckCircle className="w-6 h-6" />}
            label="Completed"
            value={totals.completed}
          />

          <StatCard
            icon={<XCircle className="w-6 h-6" />}
            label="Canceled"
            value={totals.canceled}
          />
        </div>

        {/* SEARCH */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-lg p-5 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search doctor, specialization, fee..."
                className="
                  w-full rounded-2xl border border-slate-200
                  bg-slate-50 px-5 py-3 pr-12
                  text-sm font-medium outline-none
                  focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100
                  transition-all duration-300
                "
              />

              <Search
                size={18}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            <button
              onClick={() => {
                setQuery("");
                setShowAll(false);
              }}
              className="
                px-5 py-3 rounded-2xl
                bg-emerald-500 text-white font-semibold
                hover:bg-emerald-600
                transition-all duration-300
              "
            >
              Clear
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-[2rem] shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <div>
              <h2 className="text-2xl font-black text-slate-800">
                Doctors
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                {loading
                  ? "Loading..."
                  : `Showing ${visibleDoctors.length} of ${filteredDoctors.length}`}
              </p>
            </div>
          </div>

          {/* DESKTOP TABLE */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {[
                    "Doctor",
                    "Specialization",
                    "Fee",
                    "Appointments",
                    "Completed",
                    "Canceled",
                    "Earnings",
                  ].map((head) => (
                    <th
                      key={head}
                      className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {visibleDoctors.map((d, idx) => (
                  <tr
                    key={d.id}
                    className={`border-b border-slate-100 hover:bg-emerald-50/40 transition-all duration-300 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                      }`}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <img
                          src={d.image}
                          alt={d.name}
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
                        />

                        <div>
                          <h3 className="font-bold text-slate-800">
                            {d.name}
                          </h3>

                          <p className="text-xs text-slate-500 mt-1">
                            ID : {d.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5 font-semibold text-slate-700">
                      {d.specialization}
                    </td>

                    <td className="px-6 py-5 font-bold text-emerald-600">
                      ₹ {d.fee}
                    </td>

                    <td className="px-6 py-5 font-semibold">
                      {d.appointments.total}
                    </td>

                    <td className="px-6 py-5 font-semibold text-emerald-600">
                      {d.appointments.completed}
                    </td>

                    <td className="px-6 py-5 font-semibold text-red-500">
                      {d.appointments.canceled}
                    </td>

                    <td className="px-6 py-5 font-bold text-cyan-600">
                      ₹ {d.earnings.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE */}
          <div className="lg:hidden p-4 space-y-4">
            {visibleDoctors.map((d) => (
              <MobileDoctorCard key={d.id} d={d} />
            ))}
          </div>

          {filteredDoctors.length > INITIAL_COUNT && (
            <div className="flex justify-center py-6">
              <button
                onClick={() => setShowAll((s) => !s)}
                className="
                  px-6 py-3 rounded-2xl
                  bg-slate-900 text-white font-semibold
                  hover:scale-105 transition-all duration-300
                "
              >
                {showAll
                  ? "Show Less"
                  : `Show More (${filteredDoctors.length - INITIAL_COUNT})`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

function StatCard({ icon, label, value }) {
  return (
    <div
      className="
        group relative overflow-hidden
        rounded-[2rem] border border-slate-200
        bg-white/80 backdrop-blur-xl
        p-6 shadow-lg
        hover:-translate-y-1 hover:shadow-2xl
        transition-all duration-300
      "
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100 rounded-full blur-2xl opacity-40 group-hover:scale-150 transition-all duration-500" />

      <div className="relative z-10 flex items-center gap-4">
        <div
          className="
            w-14 h-14 rounded-2xl
            bg-gradient-to-br from-emerald-500 to-cyan-500
            flex items-center justify-center
            text-white shadow-lg
          "
        >
          {icon}
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-500">
            {label}
          </p>

          <h3 className="text-2xl font-black text-slate-800 mt-1">
            {value}
          </h3>
        </div>
      </div>
    </div>
  );
}

function MobileDoctorCard({ d }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={d.image}
            alt={d.name}
            className="w-14 h-14 rounded-2xl object-cover"
          />

          <div>
            <h3 className="font-bold text-slate-800">
              {d.name}
            </h3>

            <p className="text-sm text-slate-500">
              {d.specialization}
            </p>
          </div>
        </div>

        <div className="font-bold text-emerald-600">
          ₹ {d.fee}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-5">
        <MiniStat
          label="Appointments"
          value={d.appointments.total}
        />

        <MiniStat
          label="Completed"
          value={d.appointments.completed}
          color="text-emerald-600"
        />

        <MiniStat
          label="Canceled"
          value={d.appointments.canceled}
          color="text-red-500"
        />
      </div>

      <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
        <span className="text-sm font-semibold text-slate-500">
          Total Earnings
        </span>

        <span className="font-black text-cyan-600">
          ₹ {d.earnings.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color = "text-slate-800" }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 text-center">
      <p className="text-xs font-semibold text-slate-500">
        {label}
      </p>

      <h4 className={`mt-1 text-lg font-black ${color}`}>
        {value}
      </h4>
    </div>
  );
}