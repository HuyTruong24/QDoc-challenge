const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787";

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
  chat: (profileId, message) =>
    request(`/chat`, { method: "POST", body: { profileId, message } }),

  // leave these pointing nowhere for now (you’re still using mock for map/dashboard)
  getClinicDashboard: async () => { throw new Error("Not connected"); },
  recordDose: async () => { throw new Error("Not connected"); },
  getNearbyClinics: async () => { throw new Error("Not connected"); },
  getDefaultClinicId: () => "clinic_demo_1"
};