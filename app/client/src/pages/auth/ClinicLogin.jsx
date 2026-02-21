// web/src/pages/auth/Login.jsx
import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { collection, getDoc, limit, query, where, doc } from "firebase/firestore";
import { db } from "../../firebase"; // make sure you export `db` from your firebase config
import { useAuth } from "../../hooks/useAuth";

/**
 * Clinic Login Page
 *
 * Supports:
 *  - Email/password login via your `useAuth()` hook
 *  - Optional "Clinic Code" to route user into the correct clinic dashboard
 *
 * Expected Firestore (adjust if yours differs):
 *  - collection: clinics
 *  - fields: code (string), name (string)
 *
 * If a clinic code is provided:
 *  - we look up the clinic by `code`
 *  - save clinicId + clinicName to localStorage
 *  - navigate to /dashboard?clinicId=...
 *
 * If no clinic code:
 *  - just navigate to /dashboard
 */
export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clinicCode, setClinicCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const canSubmit = useMemo(() => {
    if (!email.trim() || !password) return false;
    return true;
  }, [email, password]);

  async function resolveClinicByCode(codeRaw) {
    const code = (codeRaw || "").trim();
    if (!code) return null;

    // NOTE: Firestore might require a composite index if you change query patterns.
    const q = query(
      collection(db, "clinics"),
      where("code", "==", code),
      limit(1)
    );

    const snap = await getDocs(q);
    if (snap.empty) return null;

    const doc = snap.docs[0];
    return { clinicId: doc.id, ...doc.data() };
  }

  async function onSubmit(e) {
  e.preventDefault();
  setErr("");
  setBusy(true);

  try {
    // 1) Sign in
    const user = await login({ email: email.trim(), password });
    
    // 2) Fetch the user's profile to get their assigned clinicId
    const userDocRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDocRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const clinicId = userData.clinicId;

      if (clinicId) {
        localStorage.setItem("clinicId", clinicId);
        nav(`/clinic/dashboard?clinicId=${encodeURIComponent(clinicId)}`);
      } else {
        nav("/clinic/dashboard"); 
      }
    }
  } catch (e2) {
    setErr(e2?.message || "Login failed");
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
            <div style={styles.topTitle}>Clinic Portal</div>
            <div style={styles.topSub}>Sign in to manage today’s patients</div>
          </div>
        </div>

        <Link to="/clinic-register" style={styles.secondaryBtnLink}>
          Clinic admin register
        </Link>
      </div>

      {/* Centered login card */}
      <div style={styles.centerWrap}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <div style={styles.cardTitle}>Login</div>
              <div style={styles.cardSub}>
                Use your clinic staff account. Add a clinic code if you have one.
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} style={styles.form}>
            <Field label="Email">
              <Input
                type="email"
                placeholder="you@clinic.com"
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

            <button
              type="submit"
              disabled={busy || !canSubmit}
              style={{
                ...styles.primaryBtn,
                opacity: busy || !canSubmit ? 0.7 : 1,
                cursor: busy || !canSubmit ? "not-allowed" : "pointer",
              }}
            >
              {busy ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div style={styles.footerText}>
            Are you a patient?{" "}
            <Link to="/login" style={styles.link}>
              Login
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
      <div style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
        {label}
      </div>
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

  secondaryBtnLink: {
    textDecoration: "none",
    fontWeight: 800,
    color: "#0f172a",
    border: "1px solid rgba(15,23,42,0.12)",
    background: "white",
    padding: "10px 12px",
    borderRadius: 14,
    boxShadow: "0 8px 20px rgba(2,6,23,0.06)",
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
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    padding: "6px 6px 12px",
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: 950,
    color: "#0f172a",
  },

  cardSub: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
    lineHeight: 1.35,
  },

  form: {
    display: "grid",
    gap: 12,
    padding: 6,
  },

  hint: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748b",
    lineHeight: 1.3,
  },

  errorBox: {
    border: "1px solid rgba(220,38,38,0.25)",
    background: "rgba(220,38,38,0.06)",
    color: "#7f1d1d",
    borderRadius: 14,
    padding: "10px 12px",
    fontSize: 13,
    fontWeight: 700,
  },

  primaryBtn: {
    border: "none",
    borderRadius: 14,
    padding: "12px 12px",
    fontWeight: 900,
    fontSize: 14,
    background: "#0f172a",
    color: "white",
    boxShadow: "0 12px 30px rgba(2,6,23,0.18)",
  },

  footerText: {
    fontSize: 13,
    color: "#64748b",
    padding: "10px 8px 0",
    textAlign: "center",
  },

  link: {
    color: "#0f172a",
    fontWeight: 900,
    textDecoration: "none",
  },
};
