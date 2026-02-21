import React, { useMemo, useState } from "react";
import ChatWidget from "../../components/chat/ChatWidget"; // adjust path

export default function UserDashboard() {
  // Example profile fields (edit to match your app)
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  // Mobile: slide-over chat
  const [chatOpen, setChatOpen] = useState(false);

  // Context object you can pass to the chat as “memory”
  const profile = useMemo(
    () => ({ fullName, age, location, notes }),
    [fullName, age, location, notes]
  );

  const Field = ({ label, children }) => (
    <label style={{ display: "grid", gap: 6 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>{label}</div>
      {children}
    </label>
  );

  const Input = (props) => (
    <input
      {...props}
      style={{
        width: "100%",
        borderRadius: 14,
        border: "1px solid rgba(15,23,42,0.12)",
        padding: "10px 12px",
        outline: "none",
        background: "white",
        boxShadow: "0 1px 0 rgba(2,6,23,0.04)",
      }}
    />
  );

  const TextArea = (props) => (
    <textarea
      {...props}
      style={{
        width: "100%",
        borderRadius: 14,
        border: "1px solid rgba(15,23,42,0.12)",
        padding: "10px 12px",
        outline: "none",
        background: "white",
        boxShadow: "0 1px 0 rgba(2,6,23,0.04)",
        resize: "vertical",
      }}
    />
  );

  const ChatPanel = ({ showClose, onClose }) => (
    <div style={styles.chatShell}>
      <div style={styles.chatHeader}>
        <div>
          <div style={{ fontWeight: 900, color: "#0f172a" }}>Assistant</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            Ask anything — uses your profile context
          </div>
        </div>

        {showClose ? (
          <button style={styles.iconBtn} onClick={onClose} aria-label="Close chat">
            ✕
          </button>
        ) : null}
      </div>

      <div style={styles.chatBody}>
        {/* Pass profile context if your ChatWidget supports it */}
        <ChatWidget profileId="user_1" profile={profile} />
      </div>
    </div>
  );

  return (
    <div style={styles.page}>
      {/* Top Bar */}
      <div style={styles.topbar}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={styles.logo}>U</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 950, color: "#0f172a" }}>
              User Dashboard
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              Profile + AI assistant
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button style={styles.secondaryBtn} onClick={() => setChatOpen(true)}>
            Open chat
          </button>
        </div>
      </div>

      {/* Main two-column layout */}
      <div style={styles.layout}>
        {/* Left: user content */}
        <section style={{ minWidth: 0 }}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <div style={{ fontWeight: 950, color: "#0f172a" }}>Your Profile</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  Update details — assistant uses this as context.
                </div>
              </div>
              <button
                style={styles.primaryBtn}
                onClick={() => alert("Hook up save action")}
              >
                Save
              </button>
            </div>

            <div style={styles.formGrid}>
              <Field label="Full name">
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g., Niraaj Ojha"
                />
              </Field>

              <Field label="Age">
                <Input
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g., 21"
                />
              </Field>

              <Field label="Location">
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Winnipeg"
                />
              </Field>

              <Field label="Notes / goals">
                <TextArea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything you want the assistant to consider..."
                />
              </Field>
            </div>
          </div>

          <div style={{ height: 12 }} />

          <div style={styles.card}>
            <div style={{ fontWeight: 950, color: "#0f172a" }}>Quick actions</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
              Add your own cards/widgets here (recommendations, history, etc).
            </div>

            <div style={styles.quickGrid}>
              <button style={styles.quickCard} onClick={() => setChatOpen(true)}>
                Ask the assistant
                <div style={styles.quickSub}>Get personalized help instantly</div>
              </button>

              <button style={styles.quickCard} onClick={() => alert("Add feature")}>
                View insights
                <div style={styles.quickSub}>Summaries based on your profile</div>
              </button>

              <button style={styles.quickCard} onClick={() => alert("Add feature")}>
                Export data
                <div style={styles.quickSub}>Download your info anytime</div>
              </button>
            </div>
          </div>
        </section>

        {/* Right: persistent assistant (desktop) */}
        <aside style={styles.rightCol}>
          <div style={styles.sticky}>
            <ChatPanel />
          </div>
        </aside>
      </div>

      {/* Mobile floating button */}
      <button style={styles.fab} onClick={() => setChatOpen(true)} aria-label="Open chat">
        Chat
      </button>

      {/* Mobile slide-over assistant */}
      {chatOpen ? (
        <div style={styles.overlayWrap}>
          <div style={styles.overlay} onClick={() => setChatOpen(false)} />
          <div style={styles.drawer}>
            <ChatPanel showClose onClose={() => setChatOpen(false)} />
          </div>
        </div>
      ) : null}
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

  layout: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1fr 420px",
    gap: 14,
    alignItems: "start",
  },

  rightCol: {
    display: "block",
  },

  sticky: { position: "sticky", top: 18 },

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

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
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

  quickGrid: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 10,
  },

  quickCard: {
    textAlign: "left",
    padding: 14,
    borderRadius: 16,
    border: "1px solid rgba(15,23,42,0.10)",
    background: "rgba(248,250,252,0.9)",
    cursor: "pointer",
    fontWeight: 900,
    color: "#0f172a",
    boxShadow: "0 10px 24px rgba(2,6,23,0.05)",
  },

  quickSub: { marginTop: 6, fontSize: 12, fontWeight: 600, color: "#64748b" },

  // Chat panel
  chatShell: {
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(15,23,42,0.10)",
    borderRadius: 18,
    overflow: "hidden",
    boxShadow: "0 14px 40px rgba(2,6,23,0.10)",
    height: "calc(100vh - 90px)",
    display: "flex",
    flexDirection: "column",
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

  // Mobile
  fab: {
    position: "fixed",
    right: 16,
    bottom: 16,
    zIndex: 30,
    borderRadius: 999,
    padding: "12px 16px",
    background: "#0f172a",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.2)",
    boxShadow: "0 16px 40px rgba(2,6,23,0.30)",
    cursor: "pointer",
    fontWeight: 900,
    display: "none", // turn on if you want; see note below
  },

  overlayWrap: { position: "fixed", inset: 0, zIndex: 50 },
  overlay: { position: "absolute", inset: 0, background: "rgba(2,6,23,0.45)" },

  drawer: {
    position: "absolute",
    top: 14,
    bottom: 14,
    right: 14,
    width: "min(420px, 92vw)",
  },
};