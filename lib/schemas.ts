import { z } from "zod";

/**
 * The canonical structured shape of a generated diet report.
 *
 * This single schema is the contract for the whole pipeline:
 *   1. It is handed to OpenAI as a Structured Output json_schema, so the model
 *      is *guaranteed* to return matching JSON.
 *   2. It is stored verbatim in Postgres (`reports.report_data`).
 *   3. It drives the multi-page PDF renderer.
 *
 * OpenAI Structured Outputs require every property to be "required", so we use
 * `.nullable()` (never `.optional()`) for values that may be absent, and allow
 * empty arrays for list-like sections.
 */

const MicronutrientStatus = z.enum([
  "adequate",
  "monitor",
  "increase",
  "supplement",
]);

export const DietReportSchema = z.object({
  client: z.object({
    name: z.string().describe("Client's full name if present, else 'Client'."),
    goal: z.string().describe("Primary goal, e.g. 'Fat loss', 'Muscle gain'."),
    plan_duration: z.string().describe("Plan length, e.g. '4 weeks'. '' if unknown."),
    notes: z.string().describe("Any client-specific context. '' if none."),
  }),
  overview: z.object({
    summary: z.string().describe("2–4 sentence executive summary of the plan."),
    dietary_pattern: z
      .string()
      .describe("e.g. 'High-protein, moderate-carb, calorie-controlled'."),
    key_highlights: z
      .array(z.string())
      .describe("3–6 short bullet points of the most important takeaways."),
  }),
  calories: z.object({
    daily_target_kcal: z.number().describe("Target daily energy intake in kcal."),
    maintenance_kcal: z.number().nullable().describe("Estimated maintenance kcal, or null."),
    deficit_or_surplus_kcal: z
      .number()
      .nullable()
      .describe("Negative = deficit, positive = surplus, or null."),
    notes: z.string().describe("Short note on the calorie strategy."),
  }),
  macros: z.object({
    protein_g: z.number(),
    carbs_g: z.number(),
    fats_g: z.number(),
    fiber_g: z.number().nullable(),
    protein_pct: z.number().describe("Percent of total calories from protein (0–100)."),
    carbs_pct: z.number().describe("Percent of total calories from carbs (0–100)."),
    fats_pct: z.number().describe("Percent of total calories from fats (0–100)."),
    notes: z.string(),
  }),
  micronutrients: z
    .array(
      z.object({
        name: z.string().describe("e.g. 'Vitamin D', 'Iron', 'Omega-3'."),
        amount: z.string().describe("Amount with unit, e.g. '1000 IU', '18 mg'. '' if N/A."),
        status: MicronutrientStatus.nullable(),
        note: z.string(),
      }),
    )
    .describe("Key micronutrients to track. May be empty."),
  meals: z
    .array(
      z.object({
        name: z.string().describe("e.g. 'Breakfast', 'Pre-workout'."),
        time: z.string().describe("Suggested time, e.g. '8:00 AM'. '' if unspecified."),
        items: z.array(z.string()).describe("Food items / description lines."),
        approx_kcal: z.number().nullable(),
      }),
    )
    .describe("Meal-by-meal breakdown extracted from the plan. May be empty."),
  hydration: z.object({
    daily_water_liters: z.number().nullable(),
    recommendations: z.array(z.string()),
  }),
  workout: z.object({
    focus: z.string().describe("Overall training focus, e.g. 'Strength + conditioning'."),
    weekly_split: z
      .array(
        z.object({
          day: z.string().describe("e.g. 'Monday' or 'Day 1'."),
          focus: z.string().describe("e.g. 'Upper body push'."),
          details: z.string().describe("Brief description of the session."),
        }),
      )
      .describe("Weekly training split. Infer a sensible split if none is given."),
    recommendations: z.array(z.string()),
  }),
  recovery: z.object({
    sleep_hours: z.string().describe("Recommended sleep, e.g. '7–8 hours'."),
    recommendations: z.array(z.string()),
  }),
  supplements: z
    .array(
      z.object({
        name: z.string(),
        dosage: z.string(),
        timing: z.string(),
        purpose: z.string(),
      }),
    )
    .describe("Supplement suggestions. May be empty. Never prescribe medication."),
  disclaimers: z
    .array(z.string())
    .describe("Safety disclaimers. Always include at least a general one."),
});

export type DietReport = z.infer<typeof DietReportSchema>;
export type Micronutrient = DietReport["micronutrients"][number];
export type MealPlanEntry = DietReport["meals"][number];

/** Input validation for the generate endpoint (non-file fields). */
export const GenerateInputSchema = z.object({
  clientName: z.string().trim().min(1, "Client name is required.").max(120),
});
