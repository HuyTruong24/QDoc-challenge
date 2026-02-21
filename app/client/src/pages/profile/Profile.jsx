import React, { useEffect, useState } from "react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { Link } from "react-router-dom";
import { db } from "../../firebase";
import { useAuth } from "../../hooks/useAuth";

const INITIAL_FORM = {
  patientName: "",
  dateOfBirth: "",
  gender: "",
  chronicDiseases: [""],
  vaccinationHistory: [{ vaccineName: "", date: "" }],
  phoneNumber: "",
  postalCode: "",
};

function toStringArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? "").trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[\n,;]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function toVaccineArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          return { vaccineName: item.trim(), date: "" };
        }
        if (item && typeof item === "object") {
          return {
            vaccineName: String(item.vaccineName ?? item.name ?? "").trim(),
            date: String(item.date ?? item.dateAdministered ?? "").trim(),
          };
        }
        return { vaccineName: "", date: "" };
      })
      .filter((item) => item.vaccineName || item.date);
  }

  if (typeof value === "string") {
    return value
      .split(/[\n,;]+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => ({ vaccineName: item, date: "" }));
  }

  return [];
}

function formatCanadianPostalCode(value) {
  const cleaned = String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);

  if (cleaned.length <= 3) return cleaned;
  return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
}

function isValidCanadianPostalCode(value) {
  return /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(String(value || "").trim());
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
        width: "100%",
        boxSizing: "border-box",
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

function Select(props) {
  return (
    <select
      {...props}
      style={{
        width: "100%",
        boxSizing: "border-box",
        borderRadius: 14,
        border: "1px solid rgba(15,23,42,0.12)",
        padding: "10px 12px",
        outline: "none",
        background: "white",
        boxShadow: "0 1px 0 rgba(2,6,23,0.04)",
        fontSize: 14,
        color: "#0f172a",
        appearance: "none",
        WebkitAppearance: "none",
        MozAppearance: "none",
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

function Profile() {
  const { user } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (!snap.exists()) {
          setLoading(false);
          return;
        }

        const data = snap.data();
        const profile = data?.profile || {};
        const loadedChronicDiseases = toStringArray(profile.chronicDiseases);
        const loadedVaccines = toVaccineArray(profile.vaccinationHistory);

        setForm({
          patientName: profile.patientName || data.displayName || "",
          dateOfBirth: profile.dateOfBirth || "",
          gender: profile.gender || "",
          chronicDiseases: loadedChronicDiseases.length ? loadedChronicDiseases : [""],
          vaccinationHistory: loadedVaccines.length
            ? loadedVaccines
            : [{ vaccineName: "", date: "" }],
          phoneNumber: profile.phoneNumber || "",
          postalCode: profile.postalCode || "",
        });
      } catch (err) {
        setError(err?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user?.uid]);

  function onChange(e) {
    const { name, value } = e.target;

    if (name === "postalCode") {
      setForm((prev) => ({ ...prev, postalCode: formatCanadianPostalCode(value) }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function onChronicDiseaseChange(index, value) {
    setForm((prev) => {
      const nextDiseases = [...prev.chronicDiseases];
      nextDiseases[index] = value;
      return { ...prev, chronicDiseases: nextDiseases };
    });
  }

  function addChronicDisease() {
    setForm((prev) => ({
      ...prev,
      chronicDiseases: [...prev.chronicDiseases, ""],
    }));
  }

  function removeChronicDisease(index) {
    setForm((prev) => {
      if (prev.chronicDiseases.length === 1) {
        return { ...prev, chronicDiseases: [""] };
      }
      return {
        ...prev,
        chronicDiseases: prev.chronicDiseases.filter((_, i) => i !== index),
      };
    });
  }

  function onVaccinationFieldChange(index, field, value) {
    setForm((prev) => {
      const nextVaccinations = prev.vaccinationHistory.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      );
      return { ...prev, vaccinationHistory: nextVaccinations };
    });
  }

  function addVaccinationRow() {
    setForm((prev) => ({
      ...prev,
      vaccinationHistory: [...prev.vaccinationHistory, { vaccineName: "", date: "" }],
    }));
  }

  function removeVaccinationRow(index) {
    setForm((prev) => {
      if (prev.vaccinationHistory.length === 1) {
        return { ...prev, vaccinationHistory: [{ vaccineName: "", date: "" }] };
      }
      return {
        ...prev,
        vaccinationHistory: prev.vaccinationHistory.filter((_, i) => i !== index),
      };
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!user?.uid || saving) return;

    setSaving(true);
    setStatus("");
    setError("");

    try {
      const formattedPostalCode = formatCanadianPostalCode(form.postalCode);

      if (!isValidCanadianPostalCode(formattedPostalCode)) {
        setError('Postal code must be in the format "R3T 6G8".');
        setSaving(false);
        return;
      }

      const chronicDiseases = form.chronicDiseases
        .map((item) => item.trim())
        .filter(Boolean);

      const vaccinationHistory = form.vaccinationHistory
        .map((item) => ({
          vaccineName: item.vaccineName.trim(),
          date: item.date,
        }))
        .filter((item) => item.vaccineName || item.date);

      await setDoc(
        doc(db, "users", user.uid),
        {
          displayName: form.patientName.trim(),
          updatedAt: serverTimestamp(),
          profile: {
            patientName: form.patientName.trim(),
            dateOfBirth: form.dateOfBirth,
            gender: form.gender,
            chronicDiseases,
            vaccinationHistory,
            phoneNumber: form.phoneNumber.trim(),
            postalCode: formattedPostalCode,
            updatedAt: serverTimestamp(),
          },
        },
        { merge: true }
      );

      setStatus("Profile saved.");
    } catch (err) {
      setError(err?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.topbar}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={styles.logo}>P</div>
            <div>
              <div style={styles.topTitle}>Profile</div>
              <div style={styles.topSub}>Loading your information…</div>
            </div>
          </div>
        </div>

        <div style={styles.layout}>
          <div style={styles.card}>
            <div style={styles.infoBox}>Loading profile...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={styles.logo}>P</div>
          <div>
            <div style={styles.topTitle}>Patient Profile</div>
            <div style={styles.topSub}>Manage personal and vaccination details</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link to="/vaccination-history" style={styles.secondaryBtnLink}>
            View history
          </Link>
        </div>
      </div>

      <div style={styles.layout}>
        <section style={{ minWidth: 0 }}>
          <form onSubmit={onSubmit} style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <div style={styles.cardTitle}>Patient Profile Input</div>
                <div style={styles.cardSub}>
                  Fill in your demographics, chronic diseases, and vaccine history.
                </div>
              </div>
              <button type="submit" disabled={saving} style={styles.primaryBtn}>
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>

            {/* Demographics */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Demographics</div>
              <div style={styles.sectionSub}>Basic patient information.</div>

              <div style={styles.formGrid2}>
                <Field label="Patient name">
                  <Input
                    type="text"
                    name="patientName"
                    value={form.patientName}
                    onChange={onChange}
                    placeholder="Name of patient"
                    required
                  />
                </Field>

                <Field label="Phone number">
                  <Input
                    type="tel"
                    name="phoneNumber"
                    value={form.phoneNumber}
                    onChange={onChange}
                    placeholder="Phone number"
                    required
                  />
                </Field>
              </div>

              <div style={styles.formGrid2}>
                <Field label="Postal code">
                  <Input
                    type="text"
                    name="postalCode"
                    value={form.postalCode}
                    onChange={onChange}
                    placeholder="R3T 6G8"
                    maxLength={7}
                    autoComplete="postal-code"
                    pattern="[A-Za-z]\d[A-Za-z][ ]?\d[A-Za-z]\d"
                    title='Enter postal code in format "R3T 6G8"'
                    required
                  /> 
                </Field>

                <div />
              </div>
            </div>

            {/* DOB + Gender */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Date of Birth and Gender</div>
              <div style={styles.sectionSub}>Used for eligibility and reminders.</div>

              <div style={styles.formGrid2}>
                <Field label="Date of birth">
                  <Input
                    type="date"
                    name="dateOfBirth"
                    value={form.dateOfBirth}
                    onChange={onChange}
                    required
                  />
                </Field>

                <Field label="Gender">
                  <Select name="gender" value={form.gender} onChange={onChange} required>
                    <option value="" disabled>
                      Select gender
                    </option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </Select>
                </Field>
              </div>
            </div>

            {/* Chronic Diseases */}
            <div style={styles.section}>
              <div style={styles.sectionHeaderRow}>
                <div>
                  <div style={styles.sectionTitle}>List of Chronic Diseases</div>
                  <div style={styles.sectionSub}>
                    Add one condition per row (optional).
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addChronicDisease}
                  style={styles.secondaryBtn}
                  aria-label="Add chronic disease"
                >
                  + Add disease
                </button>
              </div>

              <div style={styles.rowsWrap}>
                {form.chronicDiseases.map((disease, index) => (
                  <div key={`disease-${index}`} style={styles.inlineRow}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Input
                        type="text"
                        value={disease}
                        onChange={(e) => onChronicDiseaseChange(index, e.target.value)}
                        placeholder={`Chronic disease ${index + 1}`}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeChronicDisease(index)}
                      style={styles.iconDangerBtn}
                      aria-label={`Remove chronic disease ${index + 1}`}
                      title="Remove"
                    >
                      −
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Vaccination History */}
            <div style={styles.section}>
              <div style={styles.sectionHeaderRow}>
                <div>
                  <div style={styles.sectionTitle}>Vaccination History</div>
                  <div style={styles.sectionSub}>
                    Add vaccine names and dates you have received.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addVaccinationRow}
                  style={styles.secondaryBtn}
                  aria-label="Add vaccine record"
                >
                  + Add vaccine
                </button>
              </div>

              <div style={styles.rowsWrap}>
                {form.vaccinationHistory.map((vaccine, index) => (
                  <div key={`vaccine-${index}`} style={styles.vaccineRow}>
                    <div style={{ minWidth: 0 }}>
                      <Field label={index === 0 ? "Vaccine name" : `Vaccine ${index + 1}`}>
                        <Input
                          type="text"
                          value={vaccine.vaccineName}
                          onChange={(e) =>
                            onVaccinationFieldChange(index, "vaccineName", e.target.value)
                          }
                          placeholder="Vaccine name"
                        />
                      </Field>
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <Field label="Date">
                        <Input
                          type="date"
                          value={vaccine.date}
                          onChange={(e) =>
                            onVaccinationFieldChange(index, "date", e.target.value)
                          }
                        />
                      </Field>
                    </div>

                    <div style={styles.vaccineRemoveWrap}>
                      <button
                        type="button"
                        onClick={() => removeVaccinationRow(index)}
                        style={styles.iconDangerBtn}
                        aria-label={`Remove vaccine record ${index + 1}`}
                        title="Remove"
                      >
                        −
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error ? <div style={styles.errorBox}>{error}</div> : null}
            {!error && status ? <div style={styles.successBox}>{status}</div> : null}

            <div style={styles.footerActions}>
              <button type="submit" disabled={saving} style={styles.primaryBtn}>
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

export default Profile;

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

  layout: {
    maxWidth: 1000,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 14,
    alignItems: "start",
  },

  card: {
    background: "#fff",
    border: "1px solid rgba(15,23,42,0.08)",
    borderRadius: 18,
    padding: 14,
    boxShadow: "0 10px 30px rgba(2,6,23,0.06)",
    display: "grid",
    gap: 14,
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    paddingBottom: 12,
    borderBottom: "1px solid rgba(15,23,42,0.06)",
    marginBottom: 2,
    flexWrap: "wrap",
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

  section: {
    border: "1px solid rgba(15,23,42,0.06)",
    borderRadius: 16,
    padding: 12,
    background: "rgba(255,255,255,0.7)",
    display: "grid",
    gap: 12,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: 900,
    color: "#0f172a",
  },

  sectionSub: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748b",
  },

  sectionHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    flexWrap: "wrap",
  },

  formGrid2: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },

  rowsWrap: {
    display: "grid",
    gap: 10,
  },

  inlineRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
  },

  vaccineRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.7fr) minmax(0, 1fr) auto",
    gap: 10,
    alignItems: "end",
    border: "1px solid rgba(15,23,42,0.05)",
    borderRadius: 14,
    padding: 10,
    background: "rgba(248,250,252,0.55)",
  },

  vaccineRemoveWrap: {
    display: "grid",
    placeItems: "end",
    paddingBottom: 1,
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
    boxShadow: "0 1px 0 rgba(2,6,23,0.04)",
    whiteSpace: "nowrap",
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
    whiteSpace: "nowrap",
  },

  iconDangerBtn: {
    minWidth: 40,
    height: 40,
    borderRadius: 12,
    border: "1px solid rgba(239,68,68,0.18)",
    background: "rgba(254,242,242,0.9)",
    color: "#b91c1c",
    fontWeight: 900,
    fontSize: 18,
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    lineHeight: 1,
  },

  infoBox: {
    borderRadius: 12,
    border: "1px solid rgba(15,23,42,0.08)",
    background: "rgba(248,250,252,0.9)",
    padding: "12px 14px",
    color: "#334155",
    fontWeight: 600,
    fontSize: 14,
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

  successBox: {
    color: "#166534",
    background: "rgba(220,252,231,0.75)",
    border: "1px solid rgba(34,197,94,0.2)",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 13,
    fontWeight: 600,
  },

  footerActions: {
    display: "flex",
    justifyContent: "flex-end",
    paddingTop: 2,
  },
};