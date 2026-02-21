// web/src/components/auth/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function ProtectedRoute({ children }) {
  const { isAuthed, authLoading } = useAuth();

  if (authLoading) return <div style={{ padding: 16 }}>Loading...</div>;
  if (!isAuthed) return <Navigate to="/login" replace />;

  return children;
}