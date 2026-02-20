import { z } from "zod";

export const ProfileSchema = z.object({
  profileId: z.string().min(1),
  dobISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  riskFactors: z
    .array(z.enum(["PREGNANT", "IMMUNOCOMPROMISED", "CHRONIC_CONDITION"]))
    .optional(),
});

export const RecordSchema = z.object({
  vaccineKey: z.string().min(1),
  doseNumber: z.number().int().positive(),
  dateISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const EvaluateRequestSchema = z.object({
  profile: ProfileSchema,
  history: z.array(RecordSchema),
});