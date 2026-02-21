import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Layout from './components/Layout' 
import Dashboard from './pages/dashboard/Dashboard'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'

// placeholder pages
function PatientHome() { return <div style={{ padding: 16 }}>Patient Home</div>; }
function ClinicHome() { return <div style={{ padding: 16 }}>Clinic Dashboard</div>; }
function App() {
  return (
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
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vax-history"
            element={
              <ProtectedRoute>
                <ClinicHome />
              </ProtectedRoute>
            }
          />
           <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ClinicHome />
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

  )
}

export default App
