import React from "react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <main style={{ maxWidth: 800, margin: "48px auto", padding: 16 }}>
      <h2>Patient Dashboard</h2>
      <p>Welcome back. You are now on the dashboard.</p>
      <p>
        Need to update health details? <Link to="/profile">Go to profile</Link>.
      </p>
      <p>
        View vaccination records?{" "}
        <Link to="/vaccination-history">Open vaccination history</Link>.
      </p>
    </main>
  );
}
