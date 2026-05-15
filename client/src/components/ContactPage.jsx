import React, { useState } from "react";
import { contactPageStyles } from "../assets/dummyStyles";
import {
  Mail,
  MapPin,
  MenuSquare,
  Phone,
  SendHorizonal,
  Stethoscope,
  User,
} from "lucide-react";

const ContactPage = () => {
  const initial = {
    name: "",
    email: "",
    phone: "",
    department: "",
    service: "",
    message: "",
  };

  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  const departments = [
    "General Physician",
    "Cardiology",
    "Orthopedics",
    "Dermatology",
    "Pediatrics",
    "Gynecology",
  ];

  const servicesMapping = {
    "General Physician": [
      "General Consultation",
      "Adult Checkup",
      "Vaccination",
      "Health Screening",
    ],
    Cardiology: [
      "ECG",
      "Echocardiography",
      "Stress Test",
      "Heart Consultation",
    ],
    Orthopedics: ["Fracture Care", "Joint Pain Consultation", "Physiotherapy"],
    Dermatology: ["Skin Consultation", "Allergy Test", "Acne Treatment"],
    Pediatrics: ["Child Checkup", "Vaccination (Child)", "Growth Monitoring"],
    Gynecology: ["Antenatal Care", "Pap Smear", "Ultrasound"],
  };

  const genericServices = [
    "General Consultation",
    "ECG",
    "Blood Test",
    "X-Ray",
    "Ultrasound",
    "Physiotherapy",
    "Vaccination",
  ];

  // This function validates that all fields are filled
  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email))
      e.email = "Enter a valid email";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    else if (!/^[0-9]{10}$/.test(form.phone))
      e.phone = "Phone number must be exactly 10 digits";

    if (!form.department && !form.service) {
      e.department = "Please choose a department or service";
      e.service = "Please choose a department or service";
    }

    if (!form.message.trim()) e.message = "Please write a short message";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "department") {
      setForm((prev) => ({ ...prev, department: value, service: "" }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }

    setErrors((prev) => ({ ...prev, [name]: undefined }));

    if (name === "department" || name === "service") {
      setErrors((prev) => {
        const copy = { ...prev };
        if (
          (name === "department" && value) ||
          (name === "service" && value) ||
          form.department ||
          form.service
        ) {
          delete copy.department;
          delete copy.service;
        }
        return copy;
      });
    }
  }

  // To submit data to whatsApp
  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    const text = `*Contact Request*\nName: ${form.name}\nEmail: ${form.email
      }\nPhone: ${form.phone}\nDepartment: ${form.department || "N/A"
      }\nService: ${form.service || "N/A"}\nMessage: ${form.message}`;

    const url = `https://wa.me/9341973592?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");

    setForm(initial); // reset
    setErrors({});
    setSent(true);
    setTimeout(() => setSent(false), 4000);
  }

  // Shows the department specific services for screens
  const availableServices = form.department
    ? servicesMapping[form.department] || []
    : genericServices;

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#f8fbff] to-[#eef7ff] py-8 min-h-screen">

      {/* Background Blur */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-100/40 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-cyan-100/40 rounded-full blur-3xl"></div>

      <div className="relative max-w-7xl mx-auto px-5 lg:px-10">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="mt-4 text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Contact Our
            <span className="block bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
              Medical Team
            </span>
          </h1>

          <p className="mt-5 text-slate-600 text-lg leading-relaxed">
            Connect with our healthcare specialists instantly through WhatsApp
            and get assistance for appointments, services, and consultations.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-16 items-start">

          {/* Left Form */}
          <div className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-[32px] p-6 md:p-8 shadow-sm">

            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <User size={16} className="text-emerald-500" />
                    Full Name
                  </label>

                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Full Name"
                    className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 outline-none focus:border-emerald-400 transition-all"
                  />

                  {errors.name && (
                    <p className="mt-2 text-sm text-red-500">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <Mail size={16} className="text-cyan-500" />
                    Email
                  </label>

                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="example@gmail.com"
                    className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 outline-none focus:border-cyan-400 transition-all"
                  />

                  {errors.email && (
                    <p className="mt-2 text-sm text-red-500">
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <Phone size={16} className="text-emerald-500" />
                    Phone
                  </label>

                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="1234567890"
                    maxLength="10"
                    className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 outline-none focus:border-emerald-400 transition-all"
                  />

                  {errors.phone && (
                    <p className="mt-2 text-sm text-red-500">
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <MapPin size={16} className="text-cyan-500" />
                    Department
                  </label>

                  <select
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 outline-none focus:border-cyan-400 transition-all"
                  >
                    <option value="">Select Department</option>

                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>

                  {errors.department && (
                    <p className="mt-2 text-sm text-red-500">
                      {errors.department}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <Stethoscope size={16} className="text-emerald-500" />
                  Service
                </label>

                <select
                  name="service"
                  value={form.service}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 outline-none focus:border-emerald-400 transition-all"
                >
                  <option value="">
                    Select Service (or choose Department above)
                  </option>

                  {availableServices.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                {errors.service && (
                  <p className="mt-2 text-sm text-red-500">
                    {errors.service}
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <MenuSquare size={16} className="text-cyan-500" />
                  Message
                </label>

                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Describe your concern briefly..."
                  rows={5}
                  className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 outline-none focus:border-cyan-400 transition-all resize-none"
                />

                {errors.message && (
                  <p className="mt-2 text-sm text-red-500">
                    {errors.message}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white py-3 rounded-2xl font-semibold hover:shadow-xl transition-all duration-300"
                >
                  <SendHorizonal size={18} />
                  Send via WhatsApp
                </button>

                {sent && (
                  <p className="mt-4 text-center text-emerald-600 font-medium">
                    Opening WhatsApp and clearing form...
                  </p>
                )}
              </div>
            </form>
          </div>

          {/* Right Side */}
          <div className="space-y-6">

            <div className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-[32px] p-6 shadow-sm">
              <h3 className="text-2xl font-bold text-slate-900">
                Visit Our Clinic
              </h3>

              <p className="mt-3 text-slate-600">
                Ashoka Garden, Bhopal, MP
              </p>

              <div className="mt-5 space-y-4">
                <p className="flex items-center gap-3 text-slate-700">
                  <Phone size={18} className="text-emerald-500" />
                  9341973592
                </p>

                <p className="flex items-center gap-3 text-slate-700">
                  <Mail size={18} className="text-cyan-500" />
                  armanali0178614@gmail.com
                </p>
              </div>
            </div>

            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14662.66640274496!2d77.41975479961218!3d23.255216314178874!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x397c69d7cf48696f%3A0xddbc57014db35da2!2sAshoka%20Garden%2C%20Bhopal%2C%20Madhya%20Pradesh!5e0!3m2!1sen!2sin!4v1778851645347!5m2!1sen!2sin"
              className="w-full h-[320px] rounded-[32px] border border-slate-200 shadow-sm"
              title="Ashoka Garden Map"
              loading="lazy"
              allowFullScreen
            ></iframe>

            <div className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-[32px] p-6 shadow-sm">
              <h4 className="text-xl font-bold text-slate-900">
                Clinic Hours
              </h4>

              <p className="mt-2 text-slate-600">
                Mon - Sat: 9:00 AM - 6:00 PM
              </p>
            </div>
          </div>
        </div>

        <style>{contactPageStyles.animationKeyframes}</style>
      </div>
    </div>
  );
};

export default ContactPage;
