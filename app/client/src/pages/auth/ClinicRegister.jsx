// src/pages/auth/Register.jsx
import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../hooks/useAuth";

/**
 * Clinic Admin Registration
 *
 * Firestore structure:
 * - clinics (collection)
 *    - {clinicId}:
 *        name: string
 *        createdAt: timestamp
 *        createdBy: uid
 *
 * - users (collection)
 *    - {uid}:
 *        email: string
 *        displayName: string
 *        role: "clinic_admin"
 *        clinicId: string
 *        createdAt: timestamp
 */
export default function Register() {
  const nav = useNavigate();
  const { signup } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [clinicName, setClinicName] = useState("");

  const canSubmit = useMemo(() => {
    if (!displayName.trim()) return false;
    if (!email.trim()) return false;
    if (!password || password.length < 6) return false;
    if (!clinicName.trim()) return false;
    return true;
  }, [displayName, email, password, clinicName]);



  async function onSubmit(e) {
  e.preventDefault();
  setErr("");
  setBusy(true);

  try {
    const name = clinicName.trim();

    // 1) Wait for Auth + User Doc creation
    const user = await signup({ 
      email: email.trim(), 
      password, 
      displayName: displayName.trim() 
    });
    
    const uid = user?.uid;
    if (!uid) throw new Error("Could not create user.");

    // 2) Create clinic doc
    const clinicRef = doc(collection(db, "clinics"));
    const clinicId = clinicRef.id;

    await setDoc(clinicRef, {
      name,
      createdAt: serverTimestamp(),
      createdBy: uid,
    });

    // 3) Update user doc to reflect admin status
    // Use merge: true so we don't overwrite the email/displayName set in AuthContext
    await setDoc(
      doc(db, "users", uid),
      {
        role: "clinic_admin",
        clinicId,
      },
      { merge: true }
    );

    localStorage.setItem("clinicId", clinicId);
    nav(`/dashboard?clinicId=${encodeURIComponent(clinicId)}`);
  } catch (e2) {
    console.error(e2);
    setErr(e2?.message || "Registration failed");
  } finally {
    setBusy(false);
  }
}

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={styles.logo}>U</div>
          <div>
            <div style={styles.topTitle}>Clinic Portal</div>
            <div style={styles.topSub}>Create a clinic admin account</div>
          </div>
        </div>

        <Link to="/login" style={styles.secondaryBtnLink}>
          Back to login
        </Link>
      </div>

      <div style={styles.centerWrap}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <div style={styles.cardTitle}>Register Clinic Admin</div>
              <div style={styles.cardSub}>
                This creates a new clinic and assigns you as the admin.
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} style={styles.form}>
            <Field label="Full name">
              <Input
                type="text"
                placeholder="e.g., Dr. Alex Chen"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </Field>

            <Field label="Email">
              <Input
                type="email"
                placeholder="admin@clinic.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>

            <Field label="Password (min 6 chars)">
              <Input
                type="password"
                placeholder="Create a password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>

            <div style={styles.sectionTitle}> </div>

            <Field label="Clinic name">
              <Input
                type="text"
                placeholder="e.g., Riverbend Family Clinic"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
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
              {busy ? "Creating account..." : "Create clinic admin account"}
            </button>
          </form>

          <div style={styles.footerText}>
            Already have an account?{" "}
            <Link to="/login" style={styles.link}>
              Login
            </Link>
          </div>

          <div style={styles.footerFinePrint}>
            Tip: In production, protect clinic creation with server-side checks
            (Cloud Functions / Firestore Rules) to prevent random signups from
            creating clinics.
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: "#334155" }}>
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
  topTitle: { fontSize: 18, fontWeight: 950, color: "#0f172a", lineHeight: 1.1 },
  topSub: { fontSize: 12, color: "#64748b", marginTop: 2 },
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
  centerWrap: { flex: 1, display: "grid", placeItems: "center", padding: "10px 0 24px" },
  card: {
    width: "100%",
    maxWidth: 460,
    background: "#fff",
    border: "1px solid rgba(15,23,42,0.08)",
    borderRadius: 18,
    padding: 14,
    boxShadow: "0 10px 30px rgba(2,6,23,0.06)",
  },
  cardHeader: { display: "flex", justifyContent: "space-between", gap: 10, padding: "6px 6px 12px" },
  cardTitle: { fontSize: 18, fontWeight: 950, color: "#0f172a" },
  cardSub: { fontSize: 13, color: "#64748b", marginTop: 4, lineHeight: 1.35 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 900,
    color: "#0f172a",
    marginTop: 6,
    paddingTop: 6,
    borderTop: "1px solid rgba(15,23,42,0.08)",
  },
  form: { display: "grid", gap: 12, padding: 6 },
  hint: { marginTop: 6, fontSize: 12, color: "#64748b", lineHeight: 1.3 },
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
  footerText: { fontSize: 13, color: "#64748b", padding: "10px 8px 0" },
  footerFinePrint: { fontSize: 12, color: "#94a3b8", padding: "10px 8px 0", lineHeight: 1.35 },
  link: { color: "#0f172a", fontWeight: 900, textDecoration: "none" },
};