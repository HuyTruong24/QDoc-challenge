// web/src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";

import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";

// placeholder pages
function PatientHome() { return <div style={{ padding: 16 }}>Patient Home</div>; }
function ClinicHome() { return <div style={{ padding: 16 }}>Clinic Dashboard</div>; }

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/patient" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/patient"
            element={
              <ProtectedRoute>
                <PatientHome />
              </ProtectedRoute>
            }
          />

          <Route
            path="/clinic"
            element={
              <ProtectedRoute>
                <ClinicHome />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);