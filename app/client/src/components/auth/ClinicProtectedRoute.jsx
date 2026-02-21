import React from "react";
import { Navigate } from "react-router-dom";

export default function ClinicProtectedRoute({ children }) {
  const clinicId =
    new URLSearchParams(window.location.search).get("clinicId") ||
    localStorage.getItem("clinicId");

  if (!clinicId) return <Navigate to="/clinic/login" replace />;

  return children;
}