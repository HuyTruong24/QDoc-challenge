require("dotenv").config();
const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");

const app = express();

// Put JSON first or after cors — both fine
app.use(express.json());

const corsMiddleware = cors({
  origin: ["http://localhost:5173"], // be explicit for dev
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

// Your routes
app.post("/chat", async (req, res) => {
  try {
    const { message, context } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || "gemini-3-flash-preview";

    if (!apiKey) return res.status(500).json({ error: "Missing GEMINI_API_KEY" });

    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
You are a helpful assistant.

Context:
${JSON.stringify(context, null, 2)}

User:
${message}
`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return res.json({ reply: response.text });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// ✅ Wrap the entire app with CORS at the function boundary
exports.api = functions.https.onRequest((req, res) => {
  corsMiddleware(req, res, () => app(req, res));
});