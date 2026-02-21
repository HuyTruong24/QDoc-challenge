import "dotenv/config";
import * as functions from "firebase-functions";
import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.post("/chat", async (req, res) => {
  try {
    const { profileId, question, context } = req.body || {};
    if (!question) return res.status(400).json({ error: "Missing question" });

    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    if (!apiKey) return res.status(500).json({ error: "Missing GEMINI_API_KEY" });

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are a helpful vaccination assistant. Answer questions about vaccines, eligibility, clinic locations, and vaccination safety.

User Profile ID: ${profileId || ""}
Context Data:
${JSON.stringify(context ?? {}, null, 2)}

Provide clear, concise, and helpful answers. If you don't have enough information, ask clarifying questions.`;

    const response = await ai.models.generateContent({
      model,
      systemInstruction,
      contents: [
        {
          role: "user",
          parts: [{ text: question }],
        },
      ],
    });

    const answer =
      response.text ??
      response.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ??
      "I couldn't generate a response. Please try again.";

    return res.json({ answer });
  } catch (err) {
    console.error("Chat error:", err);
    return res.status(500).json({ error: err?.message || "Unknown error" });
  }
});

export const api = functions.https.onRequest(app);