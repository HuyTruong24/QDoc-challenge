// app/client/src/pages/clinic/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../api"; // adjust if you use alias "@/api"
import ChatWidget from "../../components/chat/ChatWidget";

function StatCard({ title, value, subtitle }) {
  return (
    <div style={styles.card}>
      <div style={{ fontSize: 12, opacity: 0.7 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6 }}>{value}</div>
      {subtitle ? <div style={{ fontSize: 12, opacity: 0.7 }}>{subtitle}</div> : null}
    </div>
  );
}

function SimpleBarChart({ items, max = 10 }) {
  const top = (items || []).slice(0, max);
  const maxVal = Math.max(1, ...top.map((i) => i.overdue || 0));

  return (
    <div style={styles.card}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>Overdue by vaccine</div>
      {top.map((i) => (
        <div key={i.vaccineKey} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 60, fontSize: 12 }}>{i.vaccineKey}</div>
          <div style={{ flex: 1, background: "#eee", borderRadius: 999, overflow: "hidden", height: 10 }}>
            <div
              style={{
                width: `${Math.round(((i.overdue || 0) / maxVal) * 100)}%`,
                height: "100%",
                background: "#111"
              }}
            />
          </div>
          <div style={{ width: 28, textAlign: "right", fontSize: 12, opacity: 0.8 }}>{i.overdue || 0}</div>
        </div>
      ))}
      <div style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>
        (Simple chart for hackathon — can swap to Recharts later)
      </div>
    </div>
  );
}

function WorklistTable({ rows, onRecordDose }) {
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rows || [];
    return (rows || []).filter((r) => {
      const vaccines = (r.overdueVaccines || []).join(",").toLowerCase();
      return r.name.toLowerCase().includes(q) || vaccines.includes(q);
    });
  }, [rows, filter]);

  return (
    <div style={styles.card}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
        <div style={{ fontWeight: 700 }}>Worklist</div>
        <input
          placeholder="Search name / vaccine (e.g., HPV)"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={styles.input}
        />
      </div>

      <div style={{ overflowX: "auto", marginTop: 12 }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Patient</th>
              <th style={styles.th}>Overdue vaccines</th>
              <th style={styles.th}>Last updated</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.profileId}>
                <td style={styles.td}>{r.name}</td>
                <td style={styles.td}>
                  {(r.overdueVaccines || []).map((v) => (
                    <span key={v} style={styles.badge}>
                      {v}
                    </span>
                  ))}
                </td>
                <td style={styles.td}>
                  {r.updatedAt ? new Date(r.updatedAt).toLocaleString() : "—"}
                </td>
                <td style={styles.td}>
                  {(r.overdueVaccines || []).length ? (
                    <button
                      style={styles.button}
                      onClick={() => onRecordDose(r.profileId, r.overdueVaccines[0])}
                      title="Record one dose (demo uses first overdue vaccine)"
                    >
                      Record dose
                    </button>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
            {!filtered.length ? (
              <tr>
                <td style={styles.td} colSpan={4}>
                  No matching patients.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 12, opacity: 0.6, marginTop: 10 }}>
        Tip: clicking “Record dose” uses mock API to update counts/worklist.
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [clinicId] = useState(() => api.getDefaultClinicId?.() || "clinic_demo_1");
  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  async function load() {
    try {
      setError("");
      setLoading(true);
      const data = await api.getClinicDashboard(clinicId);
      setDash(data);
    } catch (e) {
      setError(e.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRecordDose(profileId, vaccineKey) {
    try {
      setToast("");
      await api.recordDose({
        profileId,
        vaccineKey,
        doseNo: 1,
        dateAdministered: new Date().toISOString()
      });
      setToast(`Recorded ${vaccineKey} for ${profileId}`);
      await load();
      setTimeout(() => setToast(""), 2500);
    } catch (e) {
      setToast(e.message || "Failed to record dose");
      setTimeout(() => setToast(""), 2500);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Clinic Dashboard</div>
          <div style={{ opacity: 0.7, marginTop: 4 }}>Clinic ID: {clinicId}</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <a href="/clinic/map" style={styles.linkBtn}>Open Map</a>
          <button style={styles.button} onClick={load} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {toast ? <div style={styles.toast}>{toast}</div> : null}
      {error ? <div style={styles.error}>{error}</div> : null}

      {loading && !dash ? (
        <div style={styles.card}>Loading...</div>
      ) : (
        <>
          <div style={styles.grid}>
            <StatCard title="Overdue" value={dash?.counts?.overdue ?? 0} subtitle="Needs outreach" />
            <StatCard title="Due in 7 days" value={dash?.counts?.dueSoon7 ?? 0} subtitle="Upcoming week" />
            <StatCard title="Due in 30 days" value={dash?.counts?.dueSoon30 ?? 0} subtitle="Upcoming month" />
          </div>

          <div style={styles.grid2}>
            <SimpleBarChart items={dash?.byVaccine || []} />
            <div style={{ display: "grid", gap: 12 }}>
                <ChatWidget profileId="p1" />
                <WorklistTable rows={dash?.worklist || []} onRecordDose={handleRecordDose} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  page: { padding: 18, maxWidth: 1100, margin: "0 auto", fontFamily: "system-ui, sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14 },
  grid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12, marginBottom: 12 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 12 },
  card: { background: "#fff", border: "1px solid #eee", borderRadius: 14, padding: 14, boxShadow: "0 1px 10px rgba(0,0,0,0.04)" },
  input: { padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd", minWidth: 240 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", fontSize: 12, opacity: 0.7, borderBottom: "1px solid #eee", padding: "10px 8px" },
  td: { borderBottom: "1px solid #f2f2f2", padding: "10px 8px", verticalAlign: "top" },
  badge: { display: "inline-block", padding: "4px 8px", borderRadius: 999, background: "#f2f2f2", fontSize: 12, marginRight: 6, marginBottom: 6 },
  button: { padding: "10px 12px", borderRadius: 10, border: "1px solid #111", background: "#111", color: "#fff", cursor: "pointer" },
  linkBtn: { padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd", textDecoration: "none", color: "#111", background: "#fff" },
  toast: { marginBottom: 12, padding: "10px 12px", borderRadius: 12, background: "#111", color: "#fff" },
  error: { marginBottom: 12, padding: "10px 12px", borderRadius: 12, background: "#ffe6e6", border: "1px solid #ffb3b3", color: "#8a0000" }
};