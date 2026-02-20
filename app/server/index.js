import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => res.json({ ok: true }));

app.post("/chat", async (req, res) => {
  try {
    const { profileId, message } = req.body || {};
    if (!profileId || !message) {
      return res.status(400).json({ error: { code: "bad_request", message: "profileId and message required" } });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || "gemini-3-flash-preview";

    if (!apiKey) {
      console.error("Missing GEMINI_API_KEY. Did you create app/server/.env ?");
      return res.status(500).json({ error: { code: "config", message: "Missing GEMINI_API_KEY" } });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const prompt = buildPrompt({ profileId, message });

    const body = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 1024 , thinkingConfig: { thinkingLevel: "low" }}
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify(body)
    });

    const text = await resp.text(); // read once

    if (!resp.ok) {
      // 👇 This will show the exact Gemini error in your terminal
      console.error("Gemini error status:", resp.status);
      console.error("Gemini error body:", text);
      return res.status(502).json({
        error: { code: "gemini_error", message: `Gemini call failed: ${resp.status}`, details: safeJson(text) }
      });
    }

    const data = safeJson(text);
    const reply =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("")?.trim() ||
      "Sorry—no response generated.";

    return res.json({
      reply,
      disclaimer:
        "This is general information, not medical advice. For personal medical guidance, consult a licensed clinician."
    });
  } catch (e) {
    console.error("Server exception:", e);
    return res.status(500).json({ error: { code: "internal", message: e?.message || "Server error" } });
  }
});

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function buildPrompt({ profileId, message }) {
  return `
SYSTEM:
You are a vaccine information assistant.
- Do NOT diagnose or provide personal medical advice.
- Keep responses short and practical.
- If asked about pregnancy, immunocompromise, allergies, or contraindications: advise consulting a clinician.

CONTEXT:
ProfileId: ${profileId}

USER:
${message}

ASSISTANT:
`.trim();
}

const port = Number(process.env.PORT || 8787);
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));