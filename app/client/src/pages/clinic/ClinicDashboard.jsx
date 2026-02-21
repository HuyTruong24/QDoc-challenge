import React, { useEffect, useMemo, useState } from "react";
import { useAuthContext } from "../../context/AuthContext"; // ✅ add this
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase";

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function formatWhen(ts) {
  if (!ts) return "—";
  const date = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusBadgeStyle(status) {
  const s = String(status || "scheduled").toLowerCase();
  if (s === "checked_in") {
    return {
      background: "rgba(34,197,94,0.12)",
      border: "1px solid rgba(34,197,94,0.25)",
      color: "#047857",
    };
  }
  if (s === "completed") {
    return {
      background: "rgba(59,130,246,0.12)",
      border: "1px solid rgba(59,130,246,0.25)",
      color: "#1d4ed8",
    };
  }
  if (s === "cancelled") {
    return {
      background: "rgba(239,68,68,0.10)",
      border: "1px solid rgba(239,68,68,0.22)",
      color: "#b91c1c",
    };
  }
  return {
    background: "rgba(15,23,42,0.06)",
    border: "1px solid rgba(15,23,42,0.10)",
    color: "#334155",
  };
}

export default function ClinicDashboard({ daysAheadDefault = 7 }) {
  const { user, userDoc, authLoading, userDocLoading } = useAuthContext();

  const clinicId = userDoc?.clinicId || user?.uid;

  const [daysAhead, setDaysAhead] = useState(daysAheadDefault);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");

    // Wait for auth/doc to load before yelling “missing clinicId”
    if (authLoading || userDocLoading) {
      setLoading(true);
      return;
    }

    if (!clinicId) {
      setLoading(false);
      setRows([]);
      setError("Missing clinicId (not logged in).");
      return;
    }

    setLoading(true);

    const from = Timestamp.fromDate(startOfDay(new Date()));
    const to = Timestamp.fromDate(
      addDays(startOfDay(new Date()), Math.max(1, Number(daysAhead) || 7) + 1)
    );

    const q = query(
      collection(db, "appointments"),
      where("clinicId", "==", clinicId),
      where("scheduledAt", ">=", from),
      where("scheduledAt", "<", to),
      orderBy("scheduledAt", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const next = snap.docs.map((doc) => {
          const data = doc.data() || {};
          return {
            id: doc.id,
            patientId: data.patientId || "",
            patientName: data.patientName || "Unknown Patient",
            scheduledAt: data.scheduledAt || null,
            reason: data.reason || "",
            status: data.status || "scheduled",
          };
        });
        setRows(next);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        setRows([]);
        setError(err?.message || "Failed to load appointments.");
      }
    );

    return () => unsub();
  }, [clinicId, daysAhead, authLoading, userDocLoading]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (
        statusFilter !== "all" &&
        String(r.status || "").toLowerCase() !== statusFilter
      ) {
        return false;
      }
      if (!q) return true;
      return (
        String(r.patientName || "").toLowerCase().includes(q) ||
        String(r.patientId || "").toLowerCase().includes(q) ||
        String(r.reason || "").toLowerCase().includes(q)
      );
    });
  }, [rows, search, statusFilter]);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>Clinic Dashboard</div>
          <div style={styles.subtitle}>
            Upcoming patients (real-time from Firestore)
          </div>
        </div>

        <div style={styles.controlsRow}>
          <label style={styles.label}>
            Days ahead
            <select
              value={daysAhead}
              onChange={(e) => setDaysAhead(Number(e.target.value))}
              style={styles.select}
            >
              {[1, 3, 7, 14, 30].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.label}>
            Status
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={styles.select}
            >
              <option value="all">All</option>
              <option value="scheduled">Scheduled</option>
              <option value="checked_in">Checked in</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient / reason…"
            style={styles.search}
          />
        </div>
      </div>

      {error ? <div style={styles.error}>{error}</div> : null}

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.cardTitle}>Scheduled Visits</div>
          <div style={styles.cardMeta}>
            {loading ? "Loading…" : `${filtered.length} shown / ${rows.length} total`}
          </div>
        </div>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Patient</th>
                <th style={styles.th}>When</th>
                <th style={styles.th}>Reason</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td style={styles.td} colSpan={4}>
                    Loading upcoming appointments…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td style={styles.td} colSpan={4}>
                    No upcoming patients found in the next {daysAhead} day(s).
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>
                        {r.patientName}
                      </div>
                      {r.patientId ? (
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          ID: {r.patientId}
                        </div>
                      ) : null}
                    </td>
                    <td style={styles.td}>{formatWhen(r.scheduledAt)}</td>
                    <td style={styles.td}>{r.reason || "—"}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          ...statusBadgeStyle(r.status),
                        }}
                      >
                        {String(r.status || "scheduled").replaceAll("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={styles.hint}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>
          Firestore wiring quick checklist
        </div>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>
            Ensure you have a Firebase config that exports <code>db</code>
            (Firestore instance).
          </li>
          <li>
            Confirm your collection name (default here: <code>appointments</code>).
          </li>
          <li>
            You may need a composite index for: clinicId + scheduledAt (range) +
            orderBy scheduledAt.
          </li>
        </ul>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: 24,
    fontFamily:
      "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
    color: "#0f172a",
    background: "#f8fafc",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 16,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  title: { fontSize: 28, fontWeight: 900, letterSpacing: "-0.02em" },
  subtitle: { fontSize: 14, color: "#64748b", marginTop: 6 },
  controlsRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: 12,
    color: "#475569",
  },
  select: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(15,23,42,0.12)",
    background: "white",
    minWidth: 140,
    outline: "none",
  },
  search: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(15,23,42,0.12)",
    background: "white",
    minWidth: 240,
    outline: "none",
  },
  card: {
    background: "white",
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,0.10)",
    boxShadow: "0 10px 30px rgba(2,6,23,0.06)",
    overflow: "hidden",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    padding: "16px 16px 10px",
    borderBottom: "1px solid rgba(15,23,42,0.08)",
  },
  cardTitle: { fontSize: 16, fontWeight: 800 },
  cardMeta: { fontSize: 12, color: "#64748b" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "separate", borderSpacing: 0 },
  th: {
    textAlign: "left",
    fontSize: 12,
    color: "#475569",
    fontWeight: 700,
    padding: "12px 16px",
    background: "#f8fafc",
    position: "sticky",
    top: 0,
  },
  tr: { borderTop: "1px solid rgba(15,23,42,0.06)" },
  td: {
    padding: "14px 16px",
    borderTop: "1px solid rgba(15,23,42,0.06)",
    verticalAlign: "top",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    textTransform: "capitalize",
  },
  error: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    border: "1px solid rgba(239,68,68,0.25)",
    background: "rgba(239,68,68,0.08)",
    color: "#991b1b",
  },
  hint: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    border: "1px solid rgba(15,23,42,0.10)",
    background: "rgba(15,23,42,0.03)",
    color: "#334155",
    fontSize: 13,
  },
};
