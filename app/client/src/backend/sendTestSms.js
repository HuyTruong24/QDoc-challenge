// src/backend/sendTestSms.js
import axios from 'axios';

const TWILIO_FUNCTION_URL = import.meta.env.VITE_TWILIO_FUNCTION_URL;
const KMA_API_KEY = import.meta.env.VITE_KMA_API_KEY;

// ✅ Real SMS via Twilio Function
export async function sendTestSms(toPhone, message) {
  if (!toPhone || !message) return { ok: false, error: "Missing toPhone or message" };
  if (!TWILIO_FUNCTION_URL) return { ok: false, error: "Missing VITE_TWILIO_FUNCTION_URL" };
  if (!KMA_API_KEY) return { ok: false, error: "Missing VITE_KMA_API_KEY" };

  try {
    const res = await axios(TWILIO_FUNCTION_URL, {
      method: "POST",
      headers: {
        "X-KMA-KEY": KMA_API_KEY,
      },
      body: JSON.stringify({ toPhone, message }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || `HTTP ${res.status}` };
    }

    return { ok: true, sid: data.sid };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}