// web/src/pages/auth/Login.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await login({ email, password });
      nav("/dashboard");
    } catch (e) {
      setErr(e?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.page}>
      {/* Top bar (same vibe as dashboard) */}
      <div style={styles.topbar}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={styles.logo}>U</div>
          <div>
            <div style={styles.topTitle}>Welcome back</div>
            <div style={styles.topSub}>Sign in to continue</div>
          </div>
        </div>

        <Link to="/register" style={styles.secondaryBtnLink}>
          Create account
        </Link>
      </div>

      {/* Centered login card */}
      <div style={styles.centerWrap}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <div style={styles.cardTitle}>Login</div>
              <div style={styles.cardSub}>
                Enter your credentials to access your dashboard.
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} style={styles.form}>
            <Field label="Email">
              <Input
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>

            <Field label="Password">
              <Input
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>

            {err ? <div style={styles.errorBox}>{err}</div> : null}

            <button type="submit" disabled={busy} style={styles.primaryBtn}>
              {busy ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div style={styles.footerText}>
            No account?{" "}
            <Link to="/register" style={styles.link}>
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>{label}</div>
      {children}
    </label>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      style={{
        width: "92%",
        borderRadius: 14,
        border: "1px solid rgba(15,23,42,0.12)",
        padding: "10px 12px",
        outline: "none",
        background: "white",
        boxShadow: "0 1px 0 rgba(2,6,23,0.04)",
        fontSize: 14,
        color: "#0f172a",
      }}
      onFocus={(e) => {
        e.currentTarget.style.border = "1px solid rgba(15,23,42,0.25)";
        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(15,23,42,0.06)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.border = "1px solid rgba(15,23,42,0.12)";
        e.currentTarget.style.boxShadow = "0 1px 0 rgba(2,6,23,0.04)";
      }}
    />
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f6f7fb",
    padding: 18,
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    display: "flex",
    flexDirection: "column",
  },

  topbar: {
    maxWidth: 1200,
    width: "100%",
    margin: "0 auto 18px",
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

  centerWrap: {
    flex: 1,
    display: "grid",
    placeItems: "center",
    padding: "10px 0 24px",
  },

  card: {
    width: "100%",
    maxWidth: 430,
    background: "#fff",
    border: "1px solid rgba(15,23,42,0.08)",
    borderRadius: 18,
    padding: 14,
    boxShadow: "0 10px 30px rgba(2,6,23,0.06)",
  },

  cardHeader: {
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

  form: {
    display: "grid",
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
    marginTop: 4,
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

  footerText: {
    marginTop: 12,
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
  },

  link: {
    color: "#0f172a",
    fontWeight: 800,
    textDecoration: "none",
  },
};