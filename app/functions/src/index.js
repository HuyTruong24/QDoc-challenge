const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.post("/echo", (req, res) => {
  const { message } = req.body;
  res.json({ message });
});

exports.api = functions.https.onRequest(app);