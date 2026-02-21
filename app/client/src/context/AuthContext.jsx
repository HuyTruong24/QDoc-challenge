// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  setPersistence,
  inMemoryPersistence,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [userDoc, setUserDoc] = useState(null);
  const [userDocLoading, setUserDocLoading] = useState(false);

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ✅ Make auth non-persistent (logout on refresh / dev restart)
  useEffect(() => {
    setPersistence(auth, inMemoryPersistence).catch((err) => {
      console.error("Failed to set auth persistence:", err);
    });
  }, []);

  // ✅ Keep React state in sync with Firebase Auth state
  useEffect(() => {
  const unsub = onAuthStateChanged(auth, async (u) => {
    setUser(u || null);
    setAuthLoading(false);

    if (!u) {
      setUserDoc(null);
      return;
    }

    setUserDocLoading(true);
    try {
      const snap = await getDoc(doc(db, "users", u.uid));
      setUserDoc(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    } catch (err) {
      console.error("Failed to fetch user doc:", err);
      setUserDoc(null);
    } finally {
      setUserDocLoading(false);
    }
  });

  return () => unsub();
}, []);

  // ✅ Signup: do NOT block UI on Firestore write
  async function signup({ email, password, displayName }) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // Optional: store name in Firebase Auth profile
    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }

    // Firestore write is best-effort (non-blocking)
    // If it fails (rules, network, firestore not enabled), it won't break signup UX.
    setDoc(
      doc(db, "users", cred.user.uid),
      {
        displayName: displayName || "",
        email,
        createdAt: serverTimestamp(),
        reminderPrefs: { channel: "inApp", daysBeforeDue: 7 },
        role: "patient",
      },
      { merge: true }
    ).catch((err) => {
      console.error("Firestore user doc write failed:", err);
    });

    return cred.user;
  }

  async function login({ email, password }) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    return cred.user;
  } catch (err) {
    console.error("Login failed:", err.code, err.message);
    throw err;
  }
}

  async function logout() {
    await signOut(auth);
  }

  const value = useMemo(
  () => ({
    user,
    userDoc,
    authLoading,
    userDocLoading,
    isAuthed: !!user,
    signup,
    login,
    logout,
  }),
  [user, userDoc, authLoading, userDocLoading]
);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used inside <AuthProvider>");
  return ctx;
}