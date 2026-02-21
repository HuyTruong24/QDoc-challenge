// src/pages/dashboard/Dashboard.jsx
import React, { useMemo, useState } from "react";
import ChatWidget from "../../components/chat/ChatWidget";
import { useAuth } from "../../hooks/useAuth";
import { VACCINES } from "../../../../contracts/constants";
import { FaRobot } from "react-icons/fa";
import emailjs from "@emailjs/browser";

// ✅ NOTE: For production, move these into .env (VITE_*) instead of hardcoding.
const EMAILJS_SERVICE_ID = "service_em93nf8";
const EMAILJS_TEMPLATE_ID = "template_4crvvca";
const EMAILJS_PUBLIC_KEY = "U_wAcJ6IGtZLCbELK";

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

function getUiStatus(engineStatus, dueDateStr) {
  const raw = String(engineStatus || "").toUpperCase();

  if (raw === "NOT_ELIGIBLE") return UI_STATUS.NOT_ELIGIBLE;
  if (raw === "COMPLETED") return UI_STATUS.COMPLETED;
  if (raw === "OVERDUE") return UI_STATUS.OVERDUE;

  if (!dueDateStr) return UI_STATUS.NOT_ELIGIBLE;

  const du = daysUntil(dueDateStr);
  if (du == null) return UI_STATUS.NOT_ELIGIBLE;

  if (du <= 7) return UI_STATUS.DUE;
  return UI_STATUS.UPCOMING;
}

function coerceArray(result) {
  if (Array.isArray(result)) return result;
  if (result && typeof result === "object") return Object.values(result);
  return [];
}

function statusPillStyle(status) {
  if (status === UI_STATUS.OVERDUE)
    return {
      background: "rgba(254, 226, 226, 0.45)",
      color: "#b91c1c",
      border: "1px solid rgba(239,68,68,0.25)",
    };
  if (status === UI_STATUS.DUE)
    return {
      background: "rgba(254, 249, 195, 0.65)",
      color: "#a16207",
      border: "1px solid rgba(234,179,8,0.35)",
    };
  if (status === UI_STATUS.UPCOMING)
    return {
      background: "rgba(219,234,254,0.55)",
      color: "#2563eb",
      border: "1px solid rgba(59,130,246,0.28)",
    };
  if (status === UI_STATUS.COMPLETED)
    return {
      background: "rgba(220,252,231,0.65)",
      color: "#047857",
      border: "1px solid rgba(34,197,94,0.25)",
    };
  return {
    background: "rgba(241,245,249,0.95)",
    color: "#475569",
    border: "1px solid rgba(15,23,42,0.10)",
  };
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

  const [days, setDays] = useState(7);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [reminderTiming, setReminderTiming] = useState("7 days before");
  const [chatOpen, setChatOpen] = useState(false);

  // Micro-interactions
  const [hoverRowId, setHoverRowId] = useState(null);
  const [btnHover, setBtnHover] = useState({ chat: false, primary: false, logout: false });

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

        const name = VACCINES[vaccineKey] || item?.displayName || vaccineKey || `Vaccine ${idx + 1}`;
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

    const filtered = mapped.filter((r) => {
      if (!r.dueDate) return false;
      if (r.status === UI_STATUS.NOT_ELIGIBLE) return false;
      if (r.status === UI_STATUS.COMPLETED) return false;
      if (r.daysUntil == null) return false;
      return r.daysUntil <= days;
    });

    filtered.sort((a, b) => (a.daysUntil ?? 999999) - (b.daysUntil ?? 999999));
    return filtered;
  }, [userRuleEngineResult, days]);

  const summary = useMemo(() => {
    const items = coerceArray(userRuleEngineResult?.result).map((item, idx) => {
      const vaccineKey = String(item?.vaccineKey ?? "").trim();
      const dueDate = item?.dueDate ?? null;
      const status = getUiStatus(item?.status, dueDate);
      return { id: vaccineKey || idx, status };
    });

    const count = (s) => items.filter((x) => x.status === s).length;
    return {
      overdue: count(UI_STATUS.OVERDUE),
      dueSoon: count(UI_STATUS.DUE),
      upcoming: count(UI_STATUS.UPCOMING),
      completed: count(UI_STATUS.COMPLETED),
    };
  }, [userRuleEngineResult]);

  if (authLoading || userDocLoading) return <div style={styles.center}>Loading…</div>;
  if (!user) return <div style={styles.center}>Please login.</div>;
  if (!userDoc) return <div style={styles.center}>No profile found for this user.</div>;

  return (
    <div style={styles.page}>
      {/* Background */}
      <div style={styles.bgLayer} aria-hidden="true">
        <div style={{ ...styles.blob, ...styles.blob1 }} />
        <div style={{ ...styles.blob, ...styles.blob2 }} />
        <div style={{ ...styles.blob, ...styles.blob3 }} />
        <div style={styles.noise} />
      </div>

      <div style={styles.container}>
        {/* Welcome */}
        <div style={styles.welcomeRow}>
          <div style={styles.welcomeText}>
            <span style={{ color: "#94a3b8" }}>Welcome, </span>
            <span style={{ color: "#0f172a", fontWeight: 800 }}>{titleName}</span>
          </div>

          <button
            style={{
              ...styles.logoutInline,
              ...(btnHover.logout ? styles.logoutInlineHover : null),
            }}
            onMouseEnter={() => setBtnHover((p) => ({ ...p, logout: true }))}
            onMouseLeave={() => setBtnHover((p) => ({ ...p, logout: false }))}
            onClick={logout}
            title="Logout"
          >
            Logout
          </button>
        </div>

        {/* Hero */}
        <div style={styles.hero}>
          <div style={styles.heroTitle}>KeepMeAlive</div>
          <div style={styles.heroSub}>
            Know what you need, when you need it — and most importantly <b>why</b> you need it.
          </div>
        </div>

        <div style={styles.mainStack}>
          {/* Schedule */}
          <div style={styles.card}>
            <div style={styles.cardTopRow}>
              <div style={styles.cardTitle}>Upcoming Vaccine Schedule</div>

              <div style={styles.dropdownWrap}>
                <label style={styles.dropdownLabel}>Next:</label>
                <select
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  style={styles.dropdown} // ✅ now has black text
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

            <div style={styles.summaryStrip}>
              <div style={{ ...styles.summaryChip, ...styles.summaryOverdue }}>
                <span style={styles.summaryLabel}>Overdue</span>
                <span style={styles.summaryValue}>{summary.overdue}</span>
              </div>
              <div style={{ ...styles.summaryChip, ...styles.summaryDue }}>
                <span style={styles.summaryLabel}>Due soon</span>
                <span style={styles.summaryValue}>{summary.dueSoon}</span>
              </div>
              <div style={{ ...styles.summaryChip, ...styles.summaryUpcoming }}>
                <span style={styles.summaryLabel}>Upcoming</span>
                <span style={styles.summaryValue}>{summary.upcoming}</span>
              </div>
              <div style={{ ...styles.summaryChip, ...styles.summaryCompleted }}>
                <span style={styles.summaryLabel}>Completed</span>
                <span style={styles.summaryValue}>{summary.completed}</span>
              </div>
            </div>

            <div style={styles.tableWrap}>
              <div style={styles.table}>
                <div style={styles.tableHeaderSticky}>
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
                  scheduleRows.map((row, idx) => {
                    const hovered = hoverRowId === row.id;
                    return (
                      <div
                        key={row.id}
                        onMouseEnter={() => setHoverRowId(row.id)}
                        onMouseLeave={() => setHoverRowId(null)}
                        style={{
                          ...styles.tableRow,
                          background: hovered
                            ? "rgba(241,245,249,0.92)"
                            : idx % 2
                              ? "rgba(248,250,252,0.40)"
                              : "transparent",
                          transform: hovered ? "translateY(-1px)" : "translateY(0px)",
                          boxShadow: hovered ? "0 10px 26px rgba(2,6,23,0.06)" : "none",
                          border: hovered ? "1px solid rgba(15,23,42,0.06)" : "1px solid transparent",
                        }}
                      >
                        <div style={styles.cellName}>{row.name}</div>
                        <div style={{ ...styles.cell, textAlign: "right" }}>{row.duePretty}</div>
                        <div style={{ ...styles.cell, display: "flex", justifyContent: "flex-end" }}>
                          <span
                            style={{
                              ...styles.statusPill,
                              ...statusPillStyle(row.status),
                              boxShadow: "0 8px 18px rgba(2,6,23,0.06)",
                            }}
                          >
                            {row.status}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* ✅ Equal-height cards (no phone input in SMS) */}
          <div style={styles.reminderRow}>
            {/* Email */}
            <div style={styles.emailCard}>
              <div style={styles.emailTitle}>Simulate Email Reminder</div>
              <div style={styles.cardSubText}>Sends a test email to your account email.</div>

              <div style={styles.topBlock}>
                <div style={styles.rowBetween}>
                  <div style={styles.emailRowLabel}>Enable Reminders</div>

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
              </div>

              <button
                type="button"
                style={{
                  ...styles.primaryBlueBtn,
                  ...(btnHover.primary ? styles.primaryBlueBtnHover : null),
                }}
                onMouseEnter={() => setBtnHover((p) => ({ ...p, primary: true }))}
                onMouseLeave={() => setBtnHover((p) => ({ ...p, primary: false }))}
                onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
                onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
                onClick={async () => {
                  const toEmail = userDoc?.email || user?.email;
                  const toName = userDoc?.displayName || titleName || "User";

                  if (!toEmail) {
                    alert("No email found for this account.");
                    return;
                  }

                  if (!remindersEnabled) {
                    alert("Reminders are disabled. Turn them on to send reminders.");
                    return;
                  }

                  const all = coerceArray(userRuleEngineResult?.result).map((item, idx) => {
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
                  });

                  const reminderItems = all
                    .filter((r) => {
                      if (!r.dueDate) return false;
                      if (r.status === UI_STATUS.NOT_ELIGIBLE) return false;
                      if (r.status === UI_STATUS.COMPLETED) return false;
                      if (r.daysUntil == null) return false;
                      return r.daysUntil <= days;
                    })
                    .sort((a, b) => (a.daysUntil ?? 999999) - (b.daysUntil ?? 999999));

                  if (!reminderItems.length) {
                    alert(`No vaccines due in the next ${days} day(s). Try a bigger window.`);
                    return;
                  }

                  const vaccinesText = reminderItems
                    .map((v) => {
                      const remaining =
                        v.daysUntil <= 0 ? "Due now / overdue" : `${v.daysUntil} day(s) remaining`;
                      return `• ${v.name} — Due: ${v.duePretty} (${remaining})`;
                    })
                    .join("\n");

                  try {
                    await emailjs.send(
                      EMAILJS_SERVICE_ID,
                      EMAILJS_TEMPLATE_ID,
                      {
                        to_name: toName,
                        to_email: toEmail,
                        reminder_timing: reminderTiming,
                        days_window: String(days),
                        vaccine_count: String(reminderItems.length),
                        vaccines_text: vaccinesText,
                        sent_date: new Date().toLocaleString(),
                      },
                      { publicKey: EMAILJS_PUBLIC_KEY }
                    );

                    alert(`✅ Test email sent for vaccines due within next ${days} day(s)!`);
                  } catch (e) {
                    console.error(e);
                    alert("❌ Failed to send email. Check EmailJS/Brevo settings.");
                  }
                }}
              >
                ✉️ Send Test Email
              </button>

              <div style={styles.helperText}>Sends to your account email.</div>
            </div>

            {/* SMS */}
            <div style={styles.emailCard}>
              <div style={styles.emailTitle}>Simulate SMS Reminder</div>
              <div style={styles.cardSubText}>
                Sends a test SMS to your profile phone number{" "}
                <b style={{ color: "#0f172a" }}>
                  {chatContext?.profile?.phoneNumber ? `(${chatContext.profile.phoneNumber})` : "(none on file)"}
                </b>
                .
              </div>

              <div style={styles.topBlock}>
                <div style={styles.rowBetween}>
                  <div style={styles.emailRowLabel}>Enable Reminders</div>

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
              </div>

              <button
                type="button"
                style={styles.primaryBlueBtn}
                onClick={() => {
                  const phone = chatContext?.profile?.phoneNumber;

                  if (!remindersEnabled) {
                    alert("Reminders are disabled. Turn them on to send reminders.");
                    return;
                  }

                  if (!phone) {
                    alert("No phone number found. Add one to your profile first.");
                    return;
                  }

                  alert(`📱 SMS simulated to ${phone}: ${reminderTiming}`);
                }}
              >
                📱 Send Test SMS
              </button>

              <div style={styles.helperText}>Mock SMS only (hook to Twilio later).</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating chat button */}
      <button
        style={{
          ...styles.chatFab,
          ...(btnHover.chat ? styles.chatFabHover : null),
        }}
        onMouseEnter={() => setBtnHover((p) => ({ ...p, chat: true }))}
        onMouseLeave={() => setBtnHover((p) => ({ ...p, chat: false }))}
        onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
        onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
        onClick={() => setChatOpen(true)}
        aria-label="Open chat"
      >
        <FaRobot />
      </button>

      {/* Chat modal */}
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
              <div style={styles.chatIcon}>
                <FaRobot />
              </div>
              <div>
                <div style={{ color: "white", fontWeight: 850 }}>Health Assistant</div>
                <div style={{ color: "rgba(219,234,254,0.95)", fontSize: 12 }}>Always here to help</div>
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
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(1200px 600px at 10% 10%, rgba(59,130,246,0.12), transparent 60%), radial-gradient(900px 500px at 85% 15%, rgba(16,185,129,0.10), transparent 55%), radial-gradient(900px 500px at 50% 95%, rgba(168,85,247,0.10), transparent 55%), linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    position: "relative",
    overflowX: "hidden",
  },

  bgLayer: { position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 },
  blob: { position: "absolute", filter: "blur(46px)", opacity: 0.9, transform: "translateZ(0)" },
  blob1: { width: 520, height: 520, left: -140, top: 60, borderRadius: 999, background: "rgba(59,130,246,0.22)" },
  blob2: { width: 560, height: 560, right: -200, top: 120, borderRadius: 999, background: "rgba(16,185,129,0.18)" },
  blob3: { width: 620, height: 620, left: "35%", bottom: -260, borderRadius: 999, background: "rgba(168,85,247,0.16)" },
  noise: {
    position: "absolute",
    inset: 0,
    opacity: 0.04,
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E\")",
    mixBlendMode: "multiply",
  },

  center: { minHeight: "100vh", display: "grid", placeItems: "center" },
  container: { position: "relative", zIndex: 1, maxWidth: 1440, margin: "0 auto", padding: "80px 64px" },

  welcomeRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 96 },
  welcomeText: { fontSize: 15, letterSpacing: "-0.005em" },

  logoutInline: {
    border: "1px solid rgba(15,23,42,0.10)",
    background: "rgba(255,255,255,0.70)",
    color: "#0f172a",
    padding: "8px 12px",
    borderRadius: 999,
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 13,
    backdropFilter: "blur(12px)",
    transition: "transform 120ms ease, background 120ms ease",
  },
  logoutInlineHover: { transform: "translateY(-1px)", background: "rgba(255,255,255,0.92)" },

  hero: { textAlign: "center", marginBottom: 120 },
  heroTitle: { fontSize: 72, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.03em" },
  heroSub: { marginTop: 10, fontSize: 18, color: "#475569", maxWidth: 760, margin: "0 auto", lineHeight: 1.55 },

  mainStack: { maxWidth: 1024, margin: "0 auto", display: "grid", gap: 18 },

  card: {
    background: "rgba(255,255,255,0.70)",
    border: "1px solid rgba(15,23,42,0.08)",
    borderRadius: 26,
    padding: 26,
    boxShadow: "0 14px 40px rgba(2,6,23,0.06)",
    backdropFilter: "blur(14px)",
  },

  cardTopRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, marginBottom: 14 },
  cardTitle: { fontSize: 26, fontWeight: 850, color: "#0f172a", letterSpacing: "-0.01em" },

  dropdownWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(248,250,252,0.75)",
    border: "1px solid rgba(15,23,42,0.10)",
    backdropFilter: "blur(12px)",
  },
  dropdownLabel: { fontSize: 13, color: "#475569", fontWeight: 700 },
  // ✅ FIX: make "7 days" black
  dropdown: { border: "none", outline: "none", background: "transparent", fontWeight: 800, color: "#0f172a", cursor: "pointer" },

  summaryStrip: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10, marginBottom: 14 },
  summaryChip: {
    borderRadius: 16,
    padding: "10px 12px",
    border: "1px solid rgba(15,23,42,0.08)",
    background: "rgba(248,250,252,0.65)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backdropFilter: "blur(12px)",
  },
  summaryLabel: { fontSize: 12, fontWeight: 800, color: "#475569" },
  summaryValue: { fontSize: 16, fontWeight: 900, color: "#0f172a" },
  summaryOverdue: { background: "rgba(254,226,226,0.40)", border: "1px solid rgba(239,68,68,0.18)" },
  summaryDue: { background: "rgba(254,249,195,0.55)", border: "1px solid rgba(234,179,8,0.22)" },
  summaryUpcoming: { background: "rgba(219,234,254,0.45)", border: "1px solid rgba(59,130,246,0.18)" },
  summaryCompleted: { background: "rgba(220,252,231,0.55)", border: "1px solid rgba(34,197,94,0.18)" },

  tableWrap: { maxHeight: 360, overflow: "auto", borderRadius: 16 },
  table: { display: "grid", gap: 4 },
  tableHeaderSticky: {
    position: "sticky",
    top: 0,
    zIndex: 2,
    display: "grid",
    gridTemplateColumns: "2fr 1.5fr 1fr",
    gap: 14,
    padding: "12px 14px",
    borderBottom: "1px solid rgba(15,23,42,0.06)",
    fontSize: 13,
    fontWeight: 750,
    background: "rgba(255,255,255,0.78)",
    backdropFilter: "blur(12px)",
  },
  th: { color: "#64748b" },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "2fr 1.5fr 1fr",
    gap: 14,
    padding: "14px 14px",
    borderRadius: 14,
    transition: "background 140ms ease, transform 140ms ease, box-shadow 140ms ease",
  },
  cellName: { fontWeight: 850, color: "#0f172a" },
  cell: { color: "#475569", fontWeight: 600 },
  statusPill: { padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 800, lineHeight: 1, whiteSpace: "nowrap" },
  infoRow: { padding: "16px 14px", color: "#64748b", fontSize: 14, fontWeight: 600 },

  // ✅ Equal-height reminder cards
  reminderRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 18,
    justifyContent: "center",
    alignItems: "stretch", // ✅ stretch so both have same height
  },

  emailCard: {
    width: "min(520px, 92vw)",
    background: "rgba(255,255,255,0.70)",
    border: "1px solid rgba(15,23,42,0.08)",
    borderRadius: 26,
    padding: 26,
    boxShadow: "0 14px 40px rgba(2,6,23,0.06)",
    backdropFilter: "blur(14px)",
    display: "flex", // ✅ allow button/footers to align
    flexDirection: "column",
  },

  emailTitle: { fontSize: 28, fontWeight: 900, color: "#0f172a", marginBottom: 10 },
  cardSubText: { marginTop: 0, color: "#64748b", fontSize: 14, fontWeight: 650, marginBottom: 18 },

  topBlock: { paddingBottom: 6 },

  emailRowLabel: { fontSize: 16, color: "#334155", fontWeight: 800, letterSpacing: "-0.005em" },
  rowBetween: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },

  toggle: {
    width: 52,
    height: 30,
    borderRadius: 999,
    border: "1px solid rgba(15,23,42,0.10)",
    display: "flex",
    alignItems: "center",
    padding: 3,
    cursor: "pointer",
    transition: "background 160ms ease",
  },
  toggleKnob: { width: 24, height: 24, borderRadius: 999, background: "white", boxShadow: "0 6px 14px rgba(2,6,23,0.12)" },

  inputLabel: { fontSize: 14, fontWeight: 850, color: "#475569", marginBottom: 8 },

  selectBox: {
    width: "100%",
    borderRadius: 12,
    padding: "12px 12px",
    border: "1px solid rgba(15,23,42,0.12)",
    background: "rgba(248,250,252,0.78)",
    outline: "none",
    fontWeight: 800,
    color: "#0f172a",
    cursor: "pointer",
  },

  primaryBlueBtn: {
    width: "100%",
    marginTop: 18,
    padding: "14px 14px",
    borderRadius: 14,
    border: "1px solid rgba(59,130,246,0.25)",
    background: "#3b82f6",
    color: "white",
    fontWeight: 900,
    fontSize: 18,
    cursor: "pointer",
    boxShadow: "0 14px 30px rgba(59,130,246,0.22)",
    transition: "transform 120ms ease, filter 120ms ease",
  },
  primaryBlueBtnHover: { filter: "brightness(0.98)", transform: "translateY(-1px)" },

  helperText: { marginTop: 14, textAlign: "center", fontSize: 13, color: "#64748b", fontWeight: 700 },

  chatFab: {
    position: "fixed",
    right: 28,
    bottom: 28,
    width: 64,
    height: 64,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.35)",
    background: "linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)",
    color: "white",
    fontSize: 22,
    cursor: "pointer",
    boxShadow: "0 22px 55px rgba(2,6,23,0.22)",
    zIndex: 60,
    transition: "transform 120ms ease, filter 120ms ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  chatFabHover: { transform: "translateY(-1px)", filter: "brightness(1.02)" },

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
  chatIcon: { width: 40, height: 40, borderRadius: 999, background: "rgba(255,255,255,0.18)", display: "grid", placeItems: "center", fontSize: 18, color: "white" },
  chatClose: { width: 34, height: 34, borderRadius: 999, border: "none", background: "rgba(255,255,255,0.18)", color: "white", cursor: "pointer", fontWeight: 900 },
  chatBody: { padding: 12, background: "rgba(248,250,252,0.78)", flex: 1, overflow: "auto" },
};