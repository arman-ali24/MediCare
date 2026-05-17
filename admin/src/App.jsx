import React from "react";
import { Route, Routes, Link } from "react-router-dom";
import Hero from "./pages/Hero";
import { useUser } from "@clerk/clerk-react";
import Home from "./pages/Home";
import Add from "./pages/Add";
import List from "./pages/List";
import Appointments from "./pages/Appointments";
import SerDashboard from "./pages/SerDashboard";
import AddSer from "./pages/AddSer";
import ListService from "./pages/ListService";
import ServiceAppointments from "./pages/ServiceAppointments";

function RequireAuth({ children }) {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) return null;

  if (!isSignedIn)
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-100 px-4"
      >
        <div className="text-center bg-white/80 backdrop-blur-xl border border-emerald-100 shadow-xl rounded-3xl px-8 py-10 max-w-md w-full">
          <p className="text-slate-800 font-bold text-2xl mb-3">
            Please sign in to continue
          </p>

          <p className="text-slate-500 text-sm mb-6">
            Access your healthcare dashboard securely.
          </p>

          <div className="flex justify-center">
            <Link
              to="/"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold shadow-lg hover:scale-105 transition-all duration-300"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );

  return children;
}

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Hero />} />

      <Route
        path="/h"
        element={
          <RequireAuth>
            <Home />
          </RequireAuth>
        }
      />
      <Route
        path="/add"
        element={
          <RequireAuth>
            <Add />
          </RequireAuth>
        }
      />
      <Route
        path="/list"
        element={
          <RequireAuth>
            <List />
          </RequireAuth>
        }
      />
      <Route
        path="/appointments"
        element={
          <RequireAuth>
            <Appointments />
          </RequireAuth>
        }
      />
      <Route
        path="/service-dashboard"
        element={
          <RequireAuth>
            <SerDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/add-service"
        element={
          <RequireAuth>
            <AddSer />
          </RequireAuth>
        }
      />
      <Route
        path="/list-service"
        element={
          <RequireAuth>
            <ListService />
          </RequireAuth>
        }
      />
      <Route
        path="/service-appointments"
        element={
          <RequireAuth>
            <ServiceAppointments />
          </RequireAuth>
        }
      />
    </Routes>
  );
};

export default App;
