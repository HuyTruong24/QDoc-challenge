import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { EvaluateRequestSchema } from "./schemas.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rulesPath = path.join(__dirname, "rules", "v1.json");
const rules = JSON.parse(fs.readFileSync(rulesPath, "utf-8"));

export function eligibilityEvaluateHandler(req, res) {
  const parsed = EvaluateRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid request",
      details: parsed.error.flatten(),
    });
  }

  const results = (rules.vaccines || []).map((v) => ({
    vaccineKey: v.vaccineKey,
    displayName: v.displayName,
    status: "ELIGIBLE",
    dueDateISO: null,
    nextDoseNumber: 1,
    reasons: ["Temporary: eligibility engine not implemented yet."],
  }));

  return res.json({ rulesVersion: rules.version, results });
}