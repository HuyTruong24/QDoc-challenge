const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getClinicDashboard: (clinicId) =>
    request(`/clinic/dashboard?clinicId=${encodeURIComponent(clinicId)}`),

  recordDose: (payload) =>
    request(`/clinic/recordDose`, { method: "POST", body: payload }),

  getNearbyClinics: (lat, lng, vaccineKey) =>
    request(
      `/clinics/nearby?lat=${lat}&lng=${lng}${
        vaccineKey ? `&vaccineKey=${encodeURIComponent(vaccineKey)}` : ""
      }`
    ),

  chat: (profileId, message) =>
    request(`/chat`, { method: "POST", body: { profileId, message } }),

  getDefaultClinicId: () => "clinic_demo_1"
};