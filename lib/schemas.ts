import { z } from "zod";

/**
 * The canonical structured shape of a generated **Weekly Diet Macro Report**.
 *
 * This single schema is the contract for the whole pipeline:
 *   1. It is handed to the model as a Structured Output json_schema, so the
 *      reply is *guaranteed* to match this shape.
 *   2. It is stored verbatim in Postgres (`reports.report_data`, a schemaless
 *      jsonb column — no migration needed when this shape changes).
 *   3. It drives the PDF renderer and the on-screen report view.
 *
 * The model returns only the raw per-meal data it can read/estimate from the
 * source plan. All *derived* numbers — daily totals, each meal's calorie share,
 * the weekly summary and the weekly average — are computed in code
 * (`lib/report-macros.ts`) rather than trusted to the model's arithmetic.
 *
 * Structured Outputs require every property to be "required", so absent values
 * are represented with `''` / empty arrays rather than `.optional()`.
 */

/** A single meal within a day. */
export const MealEntrySchema = z.object({
  time: z
    .string()
    .describe("Meal time in 24-hour 'HH:MM' form if known (e.g. '06:00'), else ''."),
  name: z
    .string()
    .describe("Meal label as written, e.g. 'Meal 1', 'Breakfast', 'Pre-workout'."),
  foods: z
    .string()
    .describe("The foods / description for this meal on a single line, as written in the plan."),
  calories: z
    .number()
    .describe("Estimated calories (kcal) for this meal, based on standard portion sizes."),
  protein_g: z.number().describe("Estimated protein in grams for this meal."),
  carbs_g: z.number().describe("Estimated carbohydrates in grams for this meal."),
  fats_g: z.number().describe("Estimated fat in grams for this meal."),
});

/** A single day of the plan. */
const DayEntrySchema = z.object({
  label: z
    .string()
    .describe(
      "Day heading with date if present, e.g. 'Monday, 29 Jun'. If the source has no dates, use 'Day 1', 'Day 2', …",
    ),
  meals: z
    .array(MealEntrySchema)
    .describe("Meals for this day in chronological order. May be empty if the day lists none."),
});

export const DietReportSchema = z.object({
  client: z.object({
    name: z.string().describe("Client's full name if present, else 'Client'."),
    plan_name: z
      .string()
      .describe("Plan name, e.g. 'Leanr Advance - 6 Months'. '' if unknown."),
    diet_preference: z
      .string()
      .describe(
        "Dietary preference, e.g. 'Non-Vegetarian', 'Vegetarian', 'Vegan', 'Eggetarian'. '' if unknown.",
      ),
    medical_condition: z
      .string()
      .describe("Relevant medical condition / focus, e.g. 'Cholesterol', 'Diabetes', 'PCOS'. '' if none."),
    period_label: z
      .string()
      .describe("Date range the plan covers, e.g. '29 Jun – 05 Jul 2025'. '' if unknown."),
  }),
  days: z
    .array(DayEntrySchema)
    .describe(
      "One entry per day that ACTUALLY appears in the source document, in order. " +
        "Do NOT invent days that are not in the source. If the plan describes a single " +
        "generic day, return just that one day.",
    ),
  notes: z
    .string()
    .describe("Short optional note, e.g. flagging that macros are estimated. '' if none."),
});

export type DietReport = z.infer<typeof DietReportSchema>;
export type DietDay = DietReport["days"][number];
export type DietMeal = DietDay["meals"][number];

/**
 * Shape for a targeted "repair" re-extraction. When the first pass returns a day
 * with fewer meals than the rest (the small model sometimes skips the
 * afternoon/evening meals), we re-ask for just those days and merge the result.
 *
 * This is deliberately TOLERANT (unlike the strict report schema): the repair is
 * a single fail-fast call with no self-correction loop, and the small model
 * sometimes omits a field (e.g. `carbs_g`). Rather than discard an entire
 * recovered day over one missing number, we default missing/invalid fields — a
 * meal with a defaulted 0 is far better than losing it. `.catch()` also covers
 * missing keys (undefined → validation error → fallback).
 */
const LenientMealSchema = z.object({
  time: z.string().catch(""),
  name: z.string().catch(""),
  foods: z.string().catch(""),
  calories: z.coerce.number().catch(0),
  protein_g: z.coerce.number().catch(0),
  carbs_g: z.coerce.number().catch(0),
  fats_g: z.coerce.number().catch(0),
});

export const DaysPatchSchema = z.object({
  days: z
    .array(
      z.object({
        label: z.string().catch(""),
        meals: z.array(LenientMealSchema).catch([]),
      }),
    )
    .catch([]),
});
export type DaysPatch = z.infer<typeof DaysPatchSchema>;

/** Input validation for the generate endpoint (non-file fields). */
export const GenerateInputSchema = z.object({
  clientName: z.string().trim().min(1, "Client name is required.").max(120),
});
