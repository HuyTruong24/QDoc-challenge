const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.post("/chat", async (req, res) => {
  try {
    const { message, context } = req.body;

    // Get key safely (prefer env var; fallback to Firebase config)
    const apiKey =
      process.env.GEMINI_API_KEY ||
      (functions.config().gemini && functions.config().gemini.key);

    if (!apiKey) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
    }

    // ESM-only SDK inside CommonJS file:
    const { GoogleGenAI } = await import("@google/genai"); // official SDK :contentReference[oaicite:2]{index=2}
    const ai = new GoogleGenAI({ apiKey });

    // Use YOUR model string here (e.g., "gemini-3-flash-preview" shown in docs) :contentReference[oaicite:3]{index=3}
    const model = req.body.model || "YOUR_MODEL_NAME";

    const prompt = [
      "You are a helpful assistant.",
      context ? `Context (JSON): ${JSON.stringify(context)}` : "",
      `User: ${message}`,
    ]
      .filter(Boolean)
      .join("\n");

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    res.json({ text: response.text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err?.message || err) });
  }
});

exports.api = functions.https.onRequest(app);