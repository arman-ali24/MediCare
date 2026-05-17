import React, { useState } from "react";
import { loginPageStyles, toastStyles } from "../assets/dummyStyles";
import logo from "../assets/logo.png";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const STORAGE_KEY = "doctorToken_v1";

const LoginPage = () => {
  const API_BASE = "http://localhost:4000";
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((s) => ({
      ...s,
      [e.target.name]: e.target.value,
    }));
  };

  // to login
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error("All fields are required.", {
        style: toastStyles.errorToast,
      });
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/doctors/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(json?.message || "Login failed", { duration: 4000 });
        setBusy(false);
        return;
      }
      const token = json?.token || json?.data?.token;
      if (!token) {
        toast.error("Authentication token missing");
        setBusy(false);
        return;
      }

      const doctorId =
        json?.data?._id || json?.doctor?._id || json?.data?.doctor?._id;
      if (!doctorId) {
        toast.error("Doctor ID missing from server response");
        setBusy(false);
        return;
      }

      localStorage.setItem(STORAGE_KEY, token);
      window.dispatchEvent(
        new StorageEvent("storage", { key: STORAGE_KEY, newValue: token }),
      );
      toast.success("Login successful — redirecting...", {
        style: toastStyles.successToast,
      });
      setTimeout(() => {
        navigate(`/doctor-admin/${doctorId}`);
      }, 700);
    } catch (err) {
      console.error("login error", err);
      toast.error("Network error during login");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 flex items-center justify-center px-4">
      <Toaster position="top-right" reverseOrder={false} />

      <button
        onClick={() => navigate("/")}
        className="
        group absolute top-6 left-6
        inline-flex items-center gap-2
        px-4 py-2.5
        rounded-2xl
        bg-white
        border border-slate-200
        shadow-sm
        text-slate-700
        font-semibold
        hover:text-emerald-600
        hover:border-emerald-300
        hover:shadow-lg
        hover:-translate-y-0.5
        transition-all duration-300
      "
      >
        <ArrowLeft
          className="transition-transform duration-300 group-hover:-translate-x-1"
          size={18}
        />
        Back to home
      </button>

      <div className={`${loginPageStyles.loginCard} shadow-2xl border border-white/60 backdrop-blur-xl`}>
        <div className={loginPageStyles.logoContainer}>
          <img
            src={logo}
            alt="logo"
            className="w-28 sm:w-32 object-contain mx-auto"
          />
        </div>

        <h2 className={`${loginPageStyles.title} text-slate-900`}>
          Doctor Admin
        </h2>

        <p className={`${loginPageStyles.subtitle} text-slate-500`}>
          Sign in to manage your profile & schedule
        </p>

        <form onSubmit={handleLogin} className={loginPageStyles.form}>
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            className={`${loginPageStyles.input} focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all duration-300`}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className={`${loginPageStyles.input} focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all duration-300`}
            required
          />

          <button
            type="submit"
            disabled={busy}
            className="
            w-full py-3 rounded-2xl
            bg-gradient-to-r from-emerald-500 to-cyan-500
            text-white font-bold
            shadow-lg shadow-emerald-200/50
            hover:shadow-xl
            hover:-translate-y-0.5
            transition-all duration-300
          "
          >
            {busy ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
