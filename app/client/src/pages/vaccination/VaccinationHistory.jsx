import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../hooks/useAuth";

function normalizeVaccinationHistory(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === "string") {
        return { vaccineName: item.trim(), date: "" };
      }
      if (item && typeof item === "object") {
        return {
          vaccineName: String(item.vaccineName ?? item.name ?? "").trim(),
          date: String(item.date ?? item.dateAdministered ?? "").trim(),
        };
      }
      return { vaccineName: "", date: "" };
    })
    .filter((item) => item.vaccineName || item.date);
}

export default function VaccinationHistory() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadVaccinations() {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (!snap.exists()) {
          setRows([]);
          return;
        }

        const data = snap.data();
        const vaccinationHistory = data?.profile?.vaccinationHistory;
        setRows(normalizeVaccinationHistory(vaccinationHistory));
      } catch (err) {
        setError(err?.message || "Failed to load vaccination history");
      } finally {
        setLoading(false);
      }
    }

    loadVaccinations();
  }, [user?.uid]);

  return (
    <main style={{ maxWidth: 900, margin: "48px auto", padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>Vaccination History</h2>

      <p style={{ marginBottom: 16 }}>
        <Link to="/profile">Back to profile</Link>
      </p>

      {loading && <p>Loading vaccination history...</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {!loading && !error && rows.length === 0 && (
        <p>No vaccination records found.</p>
      )}

      {!loading && !error && rows.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th
                  style={{
                    borderBottom: "1px solid #d1d5db",
                    textAlign: "left",
                    padding: "10px",
                  }}
                >
                  Vaccine Name
                </th>
                <th
                  style={{
                    borderBottom: "1px solid #d1d5db",
                    textAlign: "left",
                    padding: "10px",
                  }}
                >
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.vaccineName}-${row.date}-${index}`}>
                  <td style={{ borderBottom: "1px solid #e5e7eb", padding: "10px" }}>
                    {row.vaccineName || "-"}
                  </td>
                  <td style={{ borderBottom: "1px solid #e5e7eb", padding: "10px" }}>
                    {row.date || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
