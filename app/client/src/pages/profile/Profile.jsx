import React, { useEffect, useState } from "react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../hooks/useAuth";

const INITIAL_FORM = {
  patientName: "",
  dateOfBirth: "",
  gender: "",
  chronicDiseases: [""],
  vaccinationHistory: [{ vaccineName: "", date: "" }],
  phoneNumber: "",
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
    return <main style={{ padding: 24 }}>Loading profile...</main>;
  }

  return (
    <main className="pt-24 px-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Patient Profile Input</h2>

      <form onSubmit={onSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
        <section>
          <h3 className="font-semibold text-lg mb-4">Demographics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="patientName"
              value={form.patientName}
              onChange={onChange}
              placeholder="Name of patient"
              className="border rounded px-4 py-2 w-full"
              required
            />
            <input
              type="tel"
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={onChange}
              placeholder="Phone number"
              className="border rounded px-4 py-2 w-full"
              required
            />
          </div>
        </section>

        <section>
          <h3 className="font-semibold text-lg mb-4">Date of Birth and Gender</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="date"
              name="dateOfBirth"
              value={form.dateOfBirth}
              onChange={onChange}
              className="border rounded px-4 py-2 w-full"
              required
            />
            <select
              name="gender"
              value={form.gender}
              onChange={onChange}
              className="border rounded px-4 py-2 w-full"
              required
            >
              <option value="" disabled>
                Select gender
              </option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
        </section>

        <section>
          <h3 className="font-semibold text-lg mb-4">List of Chronic Diseases</h3>
          <div className="space-y-3">
            {form.chronicDiseases.map((disease, index) => (
              <div key={`disease-${index}`} className="flex gap-2">
                <input
                  type="text"
                  value={disease}
                  onChange={(e) => onChronicDiseaseChange(index, e.target.value)}
                  placeholder={`Chronic disease ${index + 1}`}
                  className="border rounded px-4 py-2 w-full"
                />
                <button
                  type="button"
                  onClick={() => removeChronicDisease(index)}
                  className="border rounded px-3 py-2"
                  aria-label={`Remove chronic disease ${index + 1}`}
                >
                  -
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addChronicDisease}
              className="border rounded px-3 py-2"
              aria-label="Add chronic disease"
            >
              + Add chronic disease
            </button>
          </div>
        </section>

        <section>
          <h3 className="font-semibold text-lg mb-4">Vaccination History</h3>
          <div className="space-y-3">
            {form.vaccinationHistory.map((vaccine, index) => (
              <div key={`vaccine-${index}`} className="grid grid-cols-1 md:grid-cols-12 gap-2">
                <input
                  type="text"
                  value={vaccine.vaccineName}
                  onChange={(e) =>
                    onVaccinationFieldChange(index, "vaccineName", e.target.value)
                  }
                  placeholder="Vaccine name"
                  className="border rounded px-4 py-2 md:col-span-7"
                />
                <input
                  type="date"
                  value={vaccine.date}
                  onChange={(e) => onVaccinationFieldChange(index, "date", e.target.value)}
                  className="border rounded px-4 py-2 md:col-span-4"
                />
                <button
                  type="button"
                  onClick={() => removeVaccinationRow(index)}
                  className="border rounded px-3 py-2 md:col-span-1"
                  aria-label={`Remove vaccine record ${index + 1}`}
                >
                  -
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addVaccinationRow}
              className="border rounded px-3 py-2"
              aria-label="Add vaccine record"
            >
              + Add vaccine record
            </button>
          </div>
        </section>

        {(status || error) && (
          <div style={{ color: error ? "crimson" : "green" }}>{error || status}</div>
        )}

        <div className="pt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>
    </main>
  );
}

export default Profile;
