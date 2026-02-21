// src/pages/dashboard/Dashboard.jsx
import React, { useMemo, useState } from "react";
import ChatWidget from "../../components/chat/ChatWidget";
import { useAuth } from "../../hooks/useAuth";
import { VACCINES } from "../../../../contracts/constants";

const DAY_OPTIONS = [1, 7, 14, 30, 60];

const UI_STATUS = {
  UPCOMING: "Upcoming",
  DUE: "Due",
  OVERDUE: "Overdue",
  COMPLETED: "Completed",
  NOT_ELIGIBLE: "Not Eligible",
};

function formatDatePretty(dateStr) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const due = new Date(dateStr);
  if (Number.isNaN(due.getTime())) return null;
  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((due.getTime() - now.getTime()) / msPerDay);
}

// Engine statuses -> UI statuses + date window logic
function getUiStatus(engineStatus, dueDateStr) {
  const raw = String(engineStatus || "").toUpperCase();

  if (raw === "NOT_ELIGIBLE") return UI_STATUS.NOT_ELIGIBLE;
  if (raw === "COMPLETED") return UI_STATUS.COMPLETED;
  if (raw === "OVERDUE") return UI_STATUS.OVERDUE;

  // If no date but not eligible/completed, treat as not eligible
  if (!dueDateStr) return UI_STATUS.NOT_ELIGIBLE;

  const du = daysUntil(dueDateStr);
  if (du == null) return UI_STATUS.NOT_ELIGIBLE;

  // Due now / within 7 days
  if (du <= 7) return UI_STATUS.DUE;

  // Upcoming (next 30 days or beyond)
  return UI_STATUS.UPCOMING;
}

function coerceArray(result) {
  if (Array.isArray(result)) return result;
  if (result && typeof result === "object") return Object.values(result);
  return [];
}

function statusPillStyle(status) {
  // Matches the Figma vibe (light bg + border + colored text)
  if (status === UI_STATUS.OVERDUE) return { background: "rgba(254, 226, 226, 0.45)", color: "#b91c1c", border: "1px solid rgba(239,68,68,0.25)" };
  if (status === UI_STATUS.DUE) return { background: "rgba(254, 249, 195, 0.65)", color: "#a16207", border: "1px solid rgba(234,179,8,0.35)" };
  if (status === UI_STATUS.UPCOMING) return { background: "rgba(219,234,254,0.55)", color: "#2563eb", border: "1px solid rgba(59,130,246,0.28)" };
  if (status === UI_STATUS.COMPLETED) return { background: "rgba(220,252,231,0.65)", color: "#047857", border: "1px solid rgba(34,197,94,0.25)" };
  return { background: "rgba(241,245,249,0.95)", color: "#475569", border: "1px solid rgba(15,23,42,0.10)" };
}

export default function Dashboard() {
  const {
    user,
    userDoc,
    authLoading,
    userDocLoading,
    userRuleEngineResult,
    userRuleEngineResultLoading,
    logout,
  } = useAuth();

  // UI state
  const [days, setDays] = useState(7);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [reminderTiming, setReminderTiming] = useState("7 days before");
  const [chatOpen, setChatOpen] = useState(false);

  const profile = userDoc || {};
  const titleName =
    userDoc?.displayName ||
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    user?.displayName ||
    user?.email ||
    "User";

  const chatContext = useMemo(() => {
    const p = userDoc?.profile || userDoc || {};
    return {
      displayName: userDoc?.displayName || "",
      email: userDoc?.email || user?.email || "",
      profile: {
        patientName: p.patientName || titleName || "",
        dateOfBirth: p.dateOfBirth || "",
        gender: p.gender || "",
        phoneNumber: p.phoneNumber || "",
        chronicDiseases: p.chronicConditions || p.riskTags || [],
        vaccinationHistory: p.vaccinationHistory || [],
      },
      reminderPrefs: userDoc?.reminderPrefs || {},
    };
  }, [userDoc, user, titleName]);

  const scheduleRows = useMemo(() => {
    const items = coerceArray(userRuleEngineResult?.result);

    const mapped = items
      .map((item, idx) => {
        const vaccineKey = String(item?.vaccineKey ?? "").trim();
        const dueDate = item?.dueDate ?? null;

        const name =
          VACCINES[vaccineKey] ||
          item?.displayName ||
          vaccineKey ||
          `Vaccine ${idx + 1}`;

        const status = getUiStatus(item?.status, dueDate);
        const du = daysUntil(dueDate);

        return {
          id: vaccineKey || idx,
          name,
          dueDate,
          duePretty: formatDatePretty(dueDate),
          status,
          daysUntil: du,
        };
      })
      .filter((r) => r.name);

    // Only show vaccines that have a due date and are within next X days (include overdue too)
    const filtered = mapped.filter((r) => {
      if (!r.dueDate) return false;
      if (r.status === UI_STATUS.NOT_ELIGIBLE) return false;
      if (r.status === UI_STATUS.COMPLETED) return false;
      if (r.daysUntil == null) return false;
      return r.daysUntil <= days; // includes overdue because negative <= days
    });

    // Sort: overdue first, then soonest
    filtered.sort((a, b) => (a.daysUntil ?? 999999) - (b.daysUntil ?? 999999));
    return filtered;
  }, [userRuleEngineResult, days]);

  if (authLoading || userDocLoading) return <div style={styles.center}>Loading…</div>;
  if (!user) return <div style={styles.center}>Please login.</div>;
  if (!userDoc) return <div style={styles.center}>No profile found for this user.</div>;

  return (
    <div style={styles.page}>
      {/* Main Container (Figma: max 1440, px-16 py-20) */}
      <div style={styles.container}>
        {/* Welcome row */}
        <div style={styles.welcomeRow}>
          <div style={styles.welcomeText}>
            <span style={{ color: "#94a3b8" }}>Welcome, </span>
            <span style={{ color: "#0f172a", fontWeight: 800 }}>{titleName}</span>
          </div>

          {/* optional right links like V1/V2 */}
          <div style={styles.topLinks}>
            <button style={styles.linkBtn} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              V1
            </button>
            <button style={styles.linkBtn} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              V2
            </button>
          </div>
        </div>

        {/* Hero */}
        <div style={styles.hero}>
          <div style={styles.heroTitle}>KeepMeAlive</div>
          <div style={styles.heroSub}>
            Know what you need, when you need it — and never miss a dose.
          </div>
        </div>

        {/* Main content stack */}
        <div style={styles.mainStack}>
          {/* Vaccine Schedule Card */}
          <div style={styles.card}>
            <div style={styles.cardTopRow}>
              <div style={styles.cardTitle}>Upcoming Vaccine Schedule</div>

              <div style={styles.dropdownWrap}>
                <label style={styles.dropdownLabel}>Next:</label>
                <select
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  style={styles.dropdown}
                  aria-label="Select time window"
                >
                  {DAY_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d} days
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.table}>
              <div style={styles.tableHeader}>
                <div style={styles.th}>Vaccine Name</div>
                <div style={{ ...styles.th, textAlign: "right" }}>Due Date</div>
                <div style={{ ...styles.th, textAlign: "right" }}>Status</div>
              </div>

              {userRuleEngineResultLoading ? (
                <div style={styles.infoRow}>Loading schedule…</div>
              ) : scheduleRows.length === 0 ? (
                <div style={styles.infoRow}>
                  No vaccines due in the next <b>{days}</b> days.
                </div>
              ) : (
                scheduleRows.map((row, idx) => (
                  <div
                    key={row.id}
                    style={{
                      ...styles.tableRow,
                      background: idx % 2 ? "rgba(248,250,252,0.35)" : "transparent",
                    }}
                  >
                    <div style={styles.cellName}>{row.name}</div>
                    <div style={{ ...styles.cell, textAlign: "right" }}>{row.duePretty}</div>
                    <div style={{ ...styles.cell, display: "flex", justifyContent: "flex-end" }}>
                      <span style={{ ...styles.statusPill, ...statusPillStyle(row.status) }}>
                        {row.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Email Reminder Card (centered + narrow like Figma) */}
          <div style={styles.centerRow}>
            <div style={styles.emailCard}>
              <div style={styles.emailTitle}>Simulate Email Reminder</div>

              <div style={styles.rowBetween}>
                <div style={{ fontSize: 14, color: "#334155", fontWeight: 650 }}>
                  Enable Reminders
                </div>

                {/* Simple toggle */}
                <button
                  type="button"
                  onClick={() => setRemindersEnabled((p) => !p)}
                  style={{
                    ...styles.toggle,
                    background: remindersEnabled ? "#3b82f6" : "rgba(15,23,42,0.10)",
                    justifyContent: remindersEnabled ? "flex-end" : "flex-start",
                  }}
                  aria-label="Toggle reminders"
                >
                  <span style={styles.toggleKnob} />
                </button>
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={styles.inputLabel}>Reminder timing</div>
                <select
                  value={reminderTiming}
                  onChange={(e) => setReminderTiming(e.target.value)}
                  style={styles.selectBox}
                >
                  <option>On due date</option>
                  <option>1 day before</option>
                  <option>7 days before</option>
                  <option>14 days before</option>
                </select>
              </div>

              <button
                type="button"
                style={styles.primaryBlueBtn}
                onClick={() => {
                  // Hook later to real email pipeline
                  alert(`Test email simulated: ${reminderTiming} (enabled: ${remindersEnabled ? "yes" : "no"})`);
                }}
              >
                ✉️ Send Test Email
              </button>

              <div style={styles.helperText}>Sends to your account email.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating chat button */}
      <button style={styles.chatFab} onClick={() => setChatOpen(true)} aria-label="Open chat">
        💬
      </button>

      {/* Chat modal (matches the figma “popup”) */}
      <div
        style={{
          ...styles.chatModalWrap,
          pointerEvents: chatOpen ? "auto" : "none",
          opacity: chatOpen ? 1 : 0,
        }}
        aria-hidden={!chatOpen}
      >
        <div style={styles.chatBackdrop} onClick={() => setChatOpen(false)} />

        <div
          style={{
            ...styles.chatWindow,
            transform: chatOpen ? "translateY(0px)" : "translateY(10px)",
            opacity: chatOpen ? 1 : 0,
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Health Assistant"
        >
          <div style={styles.chatHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={styles.chatIcon}>💬</div>
              <div>
                <div style={{ color: "white", fontWeight: 850 }}>Health Assistant</div>
                <div style={{ color: "rgba(219,234,254,0.95)", fontSize: 12 }}>
                  Always here to help
                </div>
              </div>
            </div>

            <button style={styles.chatClose} onClick={() => setChatOpen(false)} aria-label="Close chat">
              ✕
            </button>
          </div>

          <div style={styles.chatBody}>
            <ChatWidget profileId={user.uid} profile={chatContext} eligibility={userRuleEngineResult} />
          </div>
        </div>
      </div>

      {/* optional logout button (keep it small and hidden-ish) */}
      <button style={styles.logoutMini} onClick={logout} title="Logout">
        Logout
      </button>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#ffffff", // leaving white for later 3D background
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    position: "relative",
  },
  center: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  },

  container: {
    maxWidth: 1440,
    margin: "0 auto",
    padding: "80px 64px", // py-20 px-16
  },

  welcomeRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 96, // mb-24
  },
  welcomeText: {
    fontSize: 14,
  },
  topLinks: { display: "flex", gap: 14 },
  linkBtn: {
    border: "none",
    background: "transparent",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 650,
  },

  hero: { textAlign: "center", marginBottom: 120 }, // mb-32-ish
  heroTitle: {
    fontSize: 72, // text-7xl
    fontWeight: 900,
    color: "#0f172a",
    letterSpacing: "-0.02em",
  },
  heroSub: {
    marginTop: 10,
    fontSize: 18,
    color: "#475569",
    maxWidth: 720,
    marginLeft: "auto",
    marginRight: "auto",
  },

  mainStack: {
    maxWidth: 1024, // approx max-w-5xl
    margin: "0 auto",
    display: "grid",
    gap: 18,
  },

  card: {
    background: "rgba(255,255,255,0.82)",
    border: "1px solid rgba(15,23,42,0.06)",
    borderRadius: 26,
    padding: 26,
    boxShadow: "0 10px 30px rgba(2,6,23,0.04)",
    backdropFilter: "blur(12px)",
  },

  cardTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
  },
  cardTitle: { fontSize: 26, fontWeight: 850, color: "#0f172a" },

  dropdownWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(248,250,252,0.9)",
    border: "1px solid rgba(15,23,42,0.10)",
  },
  dropdownLabel: { fontSize: 13, color: "#475569", fontWeight: 700 },
  dropdown: {
    border: "none",
    outline: "none",
    background: "transparent",
    fontWeight: 750,
    color: "#0f172a",
    cursor: "pointer",
  },

  table: { display: "grid", gap: 4 },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "2fr 1.5fr 1fr",
    gap: 14,
    padding: "12px 14px",
    borderBottom: "1px solid rgba(15,23,42,0.06)",
    color: "#64748b",
    fontSize: 13,
    fontWeight: 750,
  },
  th: { color: "#64748b" },

  tableRow: {
    display: "grid",
    gridTemplateColumns: "2fr 1.5fr 1fr",
    gap: 14,
    padding: "14px 14px",
    borderRadius: 14,
    transition: "background 120ms ease",
  },
  cellName: { fontWeight: 850, color: "#0f172a" },
  cell: { color: "#475569", fontWeight: 650 },

  statusPill: {
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    lineHeight: 1,
    whiteSpace: "nowrap",
  },

  infoRow: {
    padding: "16px 14px",
    color: "#64748b",
    fontSize: 14,
    fontWeight: 650,
  },

  centerRow: { display: "flex", justifyContent: "center" },
  emailCard: {
    width: "min(420px, 92vw)",
    background: "rgba(255,255,255,0.82)",
    border: "1px solid rgba(15,23,42,0.06)",
    borderRadius: 26,
    padding: 22,
    boxShadow: "0 10px 30px rgba(2,6,23,0.04)",
    backdropFilter: "blur(12px)",
  },
  emailTitle: { fontSize: 18, fontWeight: 850, color: "#0f172a", marginBottom: 16 },

  rowBetween: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },

  toggle: {
    width: 44,
    height: 26,
    borderRadius: 999,
    border: "1px solid rgba(15,23,42,0.10)",
    display: "flex",
    alignItems: "center",
    padding: 3,
    cursor: "pointer",
    transition: "background 160ms ease",
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 999,
    background: "white",
    boxShadow: "0 6px 14px rgba(2,6,23,0.12)",
  },

  inputLabel: { fontSize: 13, fontWeight: 750, color: "#475569", marginBottom: 8 },
  selectBox: {
    width: "100%",
    borderRadius: 14,
    padding: "12px 12px",
    border: "1px solid rgba(15,23,42,0.12)",
    background: "rgba(248,250,252,0.9)",
    outline: "none",
    fontWeight: 700,
    color: "#0f172a",
    cursor: "pointer",
  },

  primaryBlueBtn: {
    width: "100%",
    marginTop: 16,
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(59,130,246,0.25)",
    background: "#3b82f6",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 10px 22px rgba(59,130,246,0.18)",
  },

  helperText: { marginTop: 10, textAlign: "center", fontSize: 12, color: "#64748b", fontWeight: 650 },

  // Floating chat
  chatFab: {
    position: "fixed",
    right: 28,
    bottom: 28,
    width: 64,
    height: 64,
    borderRadius: 999,
    border: "none",
    background: "#3b82f6",
    color: "white",
    fontSize: 22,
    cursor: "pointer",
    boxShadow: "0 18px 40px rgba(2,6,23,0.18)",
    zIndex: 60,
  },

  chatModalWrap: { position: "fixed", inset: 0, zIndex: 70, transition: "opacity 160ms ease" },
  chatBackdrop: { position: "absolute", inset: 0, background: "rgba(2,6,23,0.20)", backdropFilter: "blur(6px)" },

  chatWindow: {
    position: "absolute",
    right: 28,
    bottom: 28,
    width: "min(400px, 92vw)",
    height: "min(600px, 82vh)",
    background: "white",
    borderRadius: 24,
    overflow: "hidden",
    border: "1px solid rgba(15,23,42,0.10)",
    boxShadow: "0 22px 70px rgba(2,6,23,0.20)",
    display: "flex",
    flexDirection: "column",
    transition: "transform 160ms ease, opacity 160ms ease",
  },

  chatHeader: {
    padding: "16px 16px",
    background: "linear-gradient(90deg, #3b82f6, #2563eb)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  chatIcon: {
    width: 40,
    height: 40,
    borderRadius: 999,
    background: "rgba(255,255,255,0.18)",
    display: "grid",
    placeItems: "center",
  },
  chatClose: {
    width: 34,
    height: 34,
    borderRadius: 999,
    border: "none",
    background: "rgba(255,255,255,0.18)",
    color: "white",
    cursor: "pointer",
    fontWeight: 900,
  },
  chatBody: { padding: 12, background: "rgba(248,250,252,0.8)", flex: 1, overflow: "auto" },

  logoutMini: {
    position: "fixed",
    top: 18,
    right: 18,
    borderRadius: 999,
    padding: "10px 14px",
    border: "1px solid rgba(15,23,42,0.10)",
    background: "rgba(255,255,255,0.92)",
    cursor: "pointer",
    fontWeight: 800,
    color: "#0f172a",
    zIndex: 55,
  },
};