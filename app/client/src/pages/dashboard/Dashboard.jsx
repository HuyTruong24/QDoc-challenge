// src/pages/dashboard/Dashboard.jsx
import React, { useMemo, useState } from "react";
import ChatWidget from "../../components/chat/ChatWidget";
import { useAuthContext } from "../../context/AuthContext";

export default function Dashboard() {
  const { user, userDoc, authLoading, userDocLoading, logout } = useAuthContext();
  const [chatOpen, setChatOpen] = useState(false);

  const profile = userDoc?.profile || {};
  const chronicDiseases = profile.chronicDiseases || [];
  const vaccinationHistory = profile.vaccinationHistory || [];
  const reminderPrefs = userDoc?.reminderPrefs || {};

  const chatContext = useMemo(
    () => ({
      displayName: userDoc?.displayName || "",
      email: userDoc?.email || user?.email || "",
      profile: {
        patientName: profile.patientName || "",
        dateOfBirth: profile.dateOfBirth || "",
        gender: profile.gender || "",
        phoneNumber: profile.phoneNumber || "",
        chronicDiseases,
        vaccinationHistory,
      },
      reminderPrefs,
    }),
    [userDoc, user, profile.patientName, profile.dateOfBirth, profile.gender, profile.phoneNumber, chronicDiseases, vaccinationHistory, reminderPrefs]
  );

  const titleName =
    userDoc?.displayName ||
    profile.patientName ||
    user?.displayName ||
    user?.email ||
    "User";

  if (authLoading || userDocLoading) return <div style={styles.center}>Loading...</div>;
  if (!user) return <div style={styles.center}>Please login.</div>;
  if (!userDoc) return <div style={styles.center}>No profile found for this user.</div>;

  return (
    <div style={styles.page}>
      {/* Top Bar */}
      <div style={styles.topbar}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={styles.logo}>Q</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 950, color: "#0f172a" }}>
              Dashboard
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              Welcome, {titleName}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button style={styles.secondaryBtn} onClick={() => setChatOpen(true)}>
            Open Chat
          </button>
          <button style={styles.dangerBtn} onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.layout}>
        {/* Profile Card */}
        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <div style={{ fontWeight: 950, color: "#0f172a" }}>Patient Profile</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                Data loaded from Firestore: <code>users/{user.uid}</code>
              </div>
            </div>
            <button style={styles.primaryBtn} onClick={() => setChatOpen(true)}>
              Ask Assistant
            </button>
          </div>

          <div style={styles.grid2}>
            <Info label="Patient Name" value={profile.patientName || "-"} />
            <Info label="Display Name" value={userDoc.displayName || "-"} />
            <Info label="Date of Birth" value={profile.dateOfBirth || "-"} />
            <Info label="Gender" value={profile.gender || "-"} />
            <Info label="Phone" value={profile.phoneNumber || "-"} />
            <Info label="Email" value={userDoc.email || user.email || "-"} />
          </div>

          <div style={{ height: 12 }} />

          <div style={styles.subCard}>
            <div style={styles.subTitle}>Chronic Diseases</div>
            {chronicDiseases.length ? (
              <ul style={styles.list}>
                {chronicDiseases.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            ) : (
              <div style={styles.muted}>None listed.</div>
            )}
          </div>

          <div style={{ height: 12 }} />

          <div style={styles.subCard}>
            <div style={styles.subTitle}>Vaccination History</div>
            {vaccinationHistory.length ? (
              <div style={styles.vaxWrap}>
                {vaccinationHistory.map((v, i) => (
                  <div key={i} style={styles.vaxRow}>
                    <div style={{ fontWeight: 900, color: "#0f172a" }}>
                      {v.vaccineName || "Unknown Vaccine"}
                    </div>
                    <div style={styles.muted}>{v.date || "-"}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.muted}>No vaccinations recorded.</div>
            )}
          </div>
        </section>

        {/* Reminder Preferences Card */}
        <aside style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <div style={{ fontWeight: 950, color: "#0f172a" }}>Reminder Preferences</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                Email/SMS settings stored in Firestore
              </div>
            </div>
          </div>

          <div style={styles.grid1}>
            <Info
              label="Email"
              value={`${reminderPrefs.email || "-"} ${
                reminderPrefs.emailEnabled ? "(enabled)" : "(disabled)"
              }`}
            />
            <Info
              label="SMS"
              value={`${reminderPrefs.phoneNumber || "-"} ${
                reminderPrefs.smsEnabled ? "(enabled)" : "(disabled)"
              }`}
            />
          </div>

          <div style={{ height: 12 }} />

          <button style={styles.secondaryBtn} onClick={() => setChatOpen(true)}>
            Ask: “What vaccines am I missing?”
          </button>
        </aside>
      </div>

      {}
      <div
        style={{
          ...styles.modalWrap,
          pointerEvents: chatOpen ? "auto" : "none",
          opacity: chatOpen ? 1 : 0,
        }}
        aria-hidden={!chatOpen}
      >
        <div
          style={{
            ...styles.overlay,
            opacity: chatOpen ? 1 : 0,
          }}
          onClick={() => setChatOpen(false)}
        />

        <div
          style={{
            ...styles.modal,
            transform: chatOpen ? "translateY(0px)" : "translateY(10px)",
            opacity: chatOpen ? 1 : 0,
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Chat Assistant"
        >
          <div style={styles.chatHeader}>
            <div>
              <div style={{ fontWeight: 950, color: "#0f172a" }}>Assistant</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                Uses your profile context
              </div>
            </div>

            <button
              style={styles.iconBtn}
              onClick={() => setChatOpen(false)}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          <div style={styles.chatBody}>
            {/* Keep mounted; hide/show modal only */}
            <ChatWidget profileId={user.uid} profile={chatContext} />
          </div>
        </div>
      </div>

      {/* Optional: floating chat button */}
      <button style={styles.fab} onClick={() => setChatOpen(true)} aria-label="Open chat">
        Chat
      </button>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div style={styles.infoBox}>
      <div style={styles.infoLabel}>{label}</div>
      <div style={styles.infoValue}>{value}</div>
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
  center: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
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
  layout: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1fr 380px",
    gap: 14,
    alignItems: "start",
  },
  card: {
    background: "#fff",
    border: "1px solid rgba(15,23,42,0.08)",
    borderRadius: 18,
    padding: 14,
    boxShadow: "0 10px 30px rgba(2,6,23,0.06)",
    minWidth: 0,
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
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
  },
  grid1: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 10,
  },
  infoBox: {
    border: "1px solid rgba(15,23,42,0.08)",
    borderRadius: 14,
    padding: 12,
    background: "rgba(248,250,252,0.85)",
  },
  infoLabel: { fontSize: 12, fontWeight: 900, color: "#334155" },
  infoValue: { marginTop: 6, fontSize: 14, fontWeight: 700, color: "#0f172a" },
  subCard: {
    border: "1px solid rgba(15,23,42,0.08)",
    borderRadius: 16,
    padding: 12,
    background: "rgba(248,250,252,0.85)",
  },
  subTitle: { fontWeight: 950, color: "#0f172a", marginBottom: 8 },
  muted: { fontSize: 12, fontWeight: 650, color: "#64748b" },
  list: { margin: 0, paddingLeft: 18, color: "#0f172a", fontWeight: 700 },
  vaxWrap: { display: "grid", gap: 10 },
  vaxRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(15,23,42,0.08)",
    background: "#fff",
  },

  primaryBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #0f172a",
    background: "#0f172a",
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(15,23,42,0.12)",
    background: "white",
    color: "#0f172a",
    fontWeight: 800,
    cursor: "pointer",
  },
  dangerBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(239,68,68,0.35)",
    background: "rgba(239,68,68,0.08)",
    color: "#991b1b",
    fontWeight: 900,
    cursor: "pointer",
  },

  // ✅ Modal (popup)
  modalWrap: {
    position: "fixed",
    inset: 0,
    zIndex: 50,
    transition: "opacity 160ms ease",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(2,6,23,0.45)",
    transition: "opacity 160ms ease",
  },
  modal: {
    position: "absolute",
    right: 14,
    bottom: 14,
    width: "min(430px, 92vw)",
    height: "min(650px, 82vh)",
    background: "rgba(255,255,255,0.95)",
    border: "1px solid rgba(15,23,42,0.10)",
    borderRadius: 18,
    overflow: "hidden",
    boxShadow: "0 18px 60px rgba(2,6,23,0.25)",
    display: "flex",
    flexDirection: "column",
    transition: "transform 160ms ease, opacity 160ms ease",
  },
  chatHeader: {
    padding: "12px 14px",
    borderBottom: "1px solid rgba(15,23,42,0.08)",
    background: "rgba(248,250,252,0.9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  chatBody: { padding: 10, overflow: "auto", flex: 1 },
  iconBtn: {
    border: "1px solid rgba(15,23,42,0.12)",
    background: "#fff",
    borderRadius: 12,
    padding: "8px 10px",
    cursor: "pointer",
    fontWeight: 900,
  },

  // Optional floating button
  fab: {
    position: "fixed",
    right: 16,
    bottom: 16,
    zIndex: 40,
    borderRadius: 999,
    padding: "12px 16px",
    background: "#0f172a",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.2)",
    boxShadow: "0 16px 40px rgba(2,6,23,0.30)",
    cursor: "pointer",
    fontWeight: 900,
  },
};