import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../hooks/useAuth";
import { VACCINES } from "../../../../contracts/constants";

function normalizeVaccinationHistory(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === "string") {
        const key = item.trim();
        return { vaccineKey: key, vaccineName: VACCINES[key] || key, date: "" };
      }

      if (item && typeof item === "object") {
        const key = String(item.vaccineKey ?? item.vaccineName ?? item.name ?? "").trim();
        const date = String(item.date ?? item.dateAdministered ?? "").trim();
        return { vaccineKey: key, vaccineName: VACCINES[key] || key, date };
      }

      return { vaccineKey: "", vaccineName: "", date: "" };
    })
    .filter((item) => item.vaccineKey || item.date);
}

export default function VaccinationHistory() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { userRuleEngineResult } = useAuth();
  

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
        const vaccinationHistory = data?.vaccinationHistory ?? data?.profile?.vaccinationHistory;
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
    <div style={styles.page}>
      {/* Top bar */}
      <div style={styles.topbar}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={styles.logo}>V</div>
          <div>
            <div style={styles.topTitle}>Vaccination History</div>
            <div style={styles.topSub}>View your saved vaccine records</div>
          </div>
        </div>

        <Link to="/profile" style={styles.secondaryBtnLink}>
          Back to profile
        </Link>
      </div>

      {/* Main content */}
      <div style={styles.layout}>
        <section style={{ minWidth: 0 }}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <div style={styles.cardTitle}>Your Records</div>
                <div style={styles.cardSub}>
                  Vaccine names and dates from your profile.
                </div>
              </div>
            </div>

            {loading && (
              <div style={styles.infoBox}>
                Loading vaccination history...
              </div>
            )}

            {!loading && error && (
              <div style={styles.errorBox}>
                {error}
              </div>
            )}

            {!loading && !error && rows.length === 0 && (
              <div style={styles.emptyState}>
                <div style={styles.emptyTitle}>No vaccination records found</div>
                <div style={styles.emptySub}>
                  Add records in your profile to see them here.
                </div>
              </div>
            )}

            {!loading && !error && rows.length > 0 && (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Vaccine Name</th>
                      <th style={styles.th}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={`${row.vaccineName}-${row.date}-${index}`} style={styles.tr}>
                        <td style={styles.tdPrimary}>{row.vaccineName || "-"}</td>
                        <td style={styles.td}>{row.date || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f6f7fb",
    padding: 18,
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  },

  topbar: {
    maxWidth: 1200,
    margin: "0 auto 14px",
    padding: "14px 14px",
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,0.08)",
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(10px)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    boxShadow: "0 10px 30px rgba(2,6,23,0.06)",
  },

  logo: {
    height: 38,
    width: 38,
    borderRadius: 14,
    background: "#0f172a",
    color: "white",
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
  },

  topTitle: {
    fontSize: 18,
    fontWeight: 950,
    color: "#0f172a",
    lineHeight: 1.1,
  },

  topSub: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },

  secondaryBtnLink: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(15,23,42,0.12)",
    background: "white",
    color: "#0f172a",
    fontWeight: 800,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 1px 0 rgba(2,6,23,0.04)",
    whiteSpace: "nowrap",
  },

  layout: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 14,
    alignItems: "start",
  },

  card: {
    background: "#fff",
    border: "1px solid rgba(15,23,42,0.08)",
    borderRadius: 18,
    padding: 14,
    boxShadow: "0 10px 30px rgba(2,6,23,0.06)",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    paddingBottom: 12,
    borderBottom: "1px solid rgba(15,23,42,0.06)",
    marginBottom: 12,
  },

  cardTitle: {
    fontWeight: 950,
    color: "#0f172a",
    fontSize: 18,
  },

  cardSub: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },

  infoBox: {
    borderRadius: 12,
    border: "1px solid rgba(15,23,42,0.08)",
    background: "rgba(248,250,252,0.9)",
    padding: "12px 14px",
    color: "#334155",
    fontWeight: 600,
    fontSize: 14,
  },

  errorBox: {
    color: "#991b1b",
    background: "rgba(254,226,226,0.7)",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 13,
    fontWeight: 600,
  },

  emptyState: {
    borderRadius: 14,
    border: "1px dashed rgba(15,23,42,0.14)",
    background: "rgba(248,250,252,0.8)",
    padding: 18,
  },

  emptyTitle: {
    fontWeight: 900,
    color: "#0f172a",
  },

  emptySub: {
    marginTop: 6,
    fontSize: 13,
    color: "#64748b",
  },

  tableWrap: {
    overflowX: "auto",
    borderRadius: 16,
    border: "1px solid rgba(15,23,42,0.08)",
    background: "white",
  },

  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    minWidth: 520,
  },

  th: {
    textAlign: "left",
    padding: "12px 14px",
    fontSize: 12,
    fontWeight: 800,
    color: "#475569",
    background: "rgba(248,250,252,0.95)",
    borderBottom: "1px solid rgba(15,23,42,0.08)",
    whiteSpace: "nowrap",
  },

  tr: {
    background: "white",
  },

  tdPrimary: {
    padding: "12px 14px",
    borderBottom: "1px solid rgba(15,23,42,0.06)",
    color: "#0f172a",
    fontWeight: 700,
  },

  td: {
    padding: "12px 14px",
    borderBottom: "1px solid rgba(15,23,42,0.06)",
    color: "#334155",
    fontWeight: 500,
  },
};