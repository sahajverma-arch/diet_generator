/**
 * ICMR-NIN alignment for the Weekly Diet Macro Report.
 *
 * Scores a plan's macronutrient energy distribution against the Indian Council
 * of Medical Research – National Institute of Nutrition (ICMR-NIN) benchmarks:
 *   • Dietary Guidelines for Indians (DGI), 2024
 *   • Nutrient Requirements for Indians (RDA), 2020
 *
 * The report does not *prescribe* the diet — it assesses an existing plan — so
 * the checks are computed here from the macros we already derive. Everything is
 * deterministic (no model involvement). Thresholds live in one place so a
 * nutrition professional can confirm/adjust them against the official DGI.
 *
 * Note on limitations: precise protein g/kg and visible-fat (added oil) checks
 * need the client's body weight, sex and activity level, which the app does not
 * currently collect. Those figures are therefore surfaced as *reference*
 * guidance, and the computed checks use energy-percentage distribution (with
 * 4/4/9 kcal per gram for protein/carbohydrate/fat).
 */
import type { WeeklyView, MacroSplitRow } from "@/lib/report-macros";

export interface IcmrRange {
  min: number;
  max: number;
}

/** ICMR-NIN reference thresholds. Edit here to match the official DGI exactly. */
export const ICMR = {
  /** Acceptable macronutrient distribution, as % of total energy. */
  carbsPctOfEnergy: { min: 50, max: 60 } as IcmrRange,
  proteinPctOfEnergy: { min: 10, max: 15 } as IcmrRange,
  fatPctOfEnergy: { min: 20, max: 30 } as IcmrRange,
  /** Minimum carbohydrate to cover brain glucose needs (g/day). */
  minCarbsGramsPerDay: 100,
  minCarbsGramsPerDayUpper: 130,
  /** Reference-only limits (not computed from the per-meal data we track). */
  addedSugarMaxPctEnergy: 5,
  saturatedFatMaxPctEnergy: 7,
  fiberGramsPer2000Kcal: 30,
  saltMaxGramsPerDay: 5,
  proteinRdaGramsPerKg: 0.83,
} as const;

export const ICMR_CITATION =
  "ICMR-NIN Dietary Guidelines for Indians (2024) & Nutrient Requirements for Indians (RDA 2020)";

export type IcmrStatus = "within" | "above" | "below";

export interface MacroCheck {
  label: string;
  /** Actual share of energy from this macro, rounded to a whole percent. */
  actualPct: number;
  range: IcmrRange;
  status: IcmrStatus;
}

export interface DayAssessment {
  label: string;
  /** Protein, Carbohydrate, Fat — in that order. */
  checks: MacroCheck[];
  carbsGrams: number;
  /** "within" when carbs meet the ≥100 g/day floor, else "below". */
  minCarbStatus: Extract<IcmrStatus, "within" | "below">;
  /** True when all three macros are within range AND the carb floor is met. */
  compliant: boolean;
}

export interface IcmrAssessment {
  average: DayAssessment | null;
  days: DayAssessment[];
  compliantDays: number;
  totalDays: number;
}

function statusFor(pct: number, range: IcmrRange): IcmrStatus {
  if (pct < range.min) return "below";
  if (pct > range.max) return "above";
  return "within";
}

function assessRow(row: MacroSplitRow): DayAssessment {
  const checks: MacroCheck[] = [
    {
      label: "Protein",
      actualPct: Math.round(row.p_pct),
      range: ICMR.proteinPctOfEnergy,
      status: statusFor(row.p_pct, ICMR.proteinPctOfEnergy),
    },
    {
      label: "Carbohydrate",
      actualPct: Math.round(row.c_pct),
      range: ICMR.carbsPctOfEnergy,
      status: statusFor(row.c_pct, ICMR.carbsPctOfEnergy),
    },
    {
      label: "Fat",
      actualPct: Math.round(row.f_pct),
      range: ICMR.fatPctOfEnergy,
      status: statusFor(row.f_pct, ICMR.fatPctOfEnergy),
    },
  ];

  const minCarbStatus = row.carbs_g >= ICMR.minCarbsGramsPerDay ? "within" : "below";
  const compliant = checks.every((c) => c.status === "within") && minCarbStatus === "within";

  return { label: row.label, checks, carbsGrams: row.carbs_g, minCarbStatus, compliant };
}

/** Assess a whole week (per-day + weekly average) against ICMR-NIN ranges. */
export function assessIcmr(weekly: WeeklyView): IcmrAssessment {
  const days = weekly.summary.map(assessRow);
  return {
    average: weekly.average ? assessRow(weekly.average) : null,
    days,
    compliantDays: days.filter((d) => d.compliant).length,
    totalDays: days.length,
  };
}

/** Human-readable range like "50–60%". */
export const fmtRange = (r: IcmrRange) => `${r.min}–${r.max}%`;

/** Short status word for display. */
export function statusLabel(s: IcmrStatus): string {
  return s === "within" ? "Within" : s === "above" ? "Above" : "Below";
}
