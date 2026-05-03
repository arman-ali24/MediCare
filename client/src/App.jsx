import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Doctors from "./pages/Doctors";
import DoctorDetail from "./pages/DoctorDetail";
import Service from "./pages/Service";
import ServiceDetailPage from "./pages/ServiceDetailPage";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import DHome from "./pages/DHome";
import List from "./doctor/List";
import EditProfile from "./doctor/EditProfile";
import Appointments from "./pages/Appointments";

const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/doctors/:id" element={<DoctorDetail />} />

        <Route path="/services" element={<Service />} />
        <Route path="/services/:id" element={<ServiceDetailPage />} />

        <Route path="/appointments" element={<Appointments />} />
        <Route path="/contact" element={<Contact />} />

        {/* Doctor */}
        <Route path="/doctor-admin/login" element={<Login />} />
        <Route path="/doctor-admin/:id" element={<DHome />} />
        <Route path="/doctor-admin/:id/appointments" element={<List />} />
        <Route
          path="/doctor-admin/:id/profile/edit"
          element={<EditProfile />}
        />
      </Routes>
    </div>
  );
};

export default App;
