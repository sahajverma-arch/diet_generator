/**
 * Derived numbers for the Weekly Diet Macro Report.
 *
 * The model returns only raw per-meal data (foods + estimated kcal/P/C/F). Every
 * figure that is a *function* of that data — daily totals, each meal's calorie
 * share, the weekly summary and the weekly average — is computed here so the
 * report's arithmetic is always internally consistent (and never depends on the
 * model doing sums correctly). Shared by the PDF renderer and the web view.
 */
import { format, parseISO, isValid } from "date-fns";
import type { DietReport, DietMeal } from "@/lib/schemas";

const PROTEIN_KCAL_PER_G = 4;
const CARB_KCAL_PER_G = 4;
const FAT_KCAL_PER_G = 9;

export interface MealRow {
  time: string;
  name: string;
  foods: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  /** Share of the day's total calories, 0–100 (unrounded). */
  cal_pct: number;
}

export interface MacroTotal {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
}

export interface DayView {
  label: string;
  meals: MealRow[];
  total: MacroTotal;
}

export interface MacroSplitRow extends MacroTotal {
  label: string;
  /** Percent of energy from each macro (4/4/9 kcal per gram), 0–100, unrounded. */
  p_pct: number;
  c_pct: number;
  f_pct: number;
}

export interface WeeklyView {
  days: DayView[];
  summary: MacroSplitRow[];
  /** null when the report contains no days. */
  average: MacroSplitRow | null;
  /** Human-readable date range, derived from the days when they carry dates. */
  periodLabel: string;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A bare ISO date label ("2026-07-01") → "Wednesday, 1 Jul". Labels that are
 * already human-readable ("Monday, 29 Jun") or generic ("Day 1") pass through
 * unchanged.
 */
export function prettyDayLabel(label: string): string {
  const s = (label ?? "").trim();
  if (!ISO_DATE.test(s)) return s;
  const d = parseISO(s);
  return isValid(d) ? format(d, "EEEE, d MMM") : s;
}

/**
 * Build the report's date range from the actual first/last dated days — more
 * reliable than the model's own summary, which is sometimes wrong (e.g. it
 * claimed "…to 2026-07-05" for a report that ran to 07-07). Falls back to the
 * model-provided label when the days aren't ISO-dated.
 */
function derivePeriodLabel(dayLabels: string[], fallback: string): string {
  const dates = dayLabels
    .map((l) => (l ?? "").trim())
    .filter((l) => ISO_DATE.test(l))
    .map((l) => parseISO(l))
    .filter(isValid)
    .sort((a, b) => a.getTime() - b.getTime());

  if (dates.length === 0) return fallback;
  const first = dates[0];
  const last = dates[dates.length - 1];
  if (first.getTime() === last.getTime()) return format(first, "d MMM yyyy");
  return `${format(first, "d MMM")} – ${format(last, "d MMM yyyy")}`;
}

/** Common dietary-preference misspellings/abbreviations → canonical form. */
const DIET_PREFERENCE_FIXES: Record<string, string> = {
  vegeterian: "Vegetarian",
  vegetarian: "Vegetarian",
  veg: "Vegetarian",
  "non-veg": "Non-Vegetarian",
  "non veg": "Non-Vegetarian",
  nonveg: "Non-Vegetarian",
  "non-vegetarian": "Non-Vegetarian",
  "non vegetarian": "Non-Vegetarian",
  eggetarian: "Eggetarian",
  vegan: "Vegan",
};

/** Normalise a dietary preference string (fixes "Vegeterian" → "Vegetarian"). */
export function normalizeDietPreference(pref: string): string {
  const key = (pref ?? "").trim().toLowerCase();
  return DIET_PREFERENCE_FIXES[key] ?? pref;
}

const emptyTotal = (): MacroTotal => ({
  calories: 0,
  protein_g: 0,
  carbs_g: 0,
  fats_g: 0,
});

/**
 * Calories implied by a meal's macros (the standard 4/4/9 identity). We display
 * these rather than the model's separately-estimated calorie figure, because the
 * small model estimates the two independently and they diverge (~30%); deriving
 * calories from the grams keeps the calorie column consistent with the macros.
 */
function kcalFromMacros(m: { protein_g: number; carbs_g: number; fats_g: number }): number {
  return (
    m.protein_g * PROTEIN_KCAL_PER_G +
    m.carbs_g * CARB_KCAL_PER_G +
    m.fats_g * FAT_KCAL_PER_G
  );
}

/** Percent of calories coming from each macro, using 4/4/9 kcal per gram. */
function macroSplit(protein_g: number, carbs_g: number, fats_g: number) {
  const p = protein_g * PROTEIN_KCAL_PER_G;
  const c = carbs_g * CARB_KCAL_PER_G;
  const f = fats_g * FAT_KCAL_PER_G;
  const total = p + c + f;
  if (total <= 0) return { p_pct: 0, c_pct: 0, f_pct: 0 };
  return {
    p_pct: (p / total) * 100,
    c_pct: (c / total) * 100,
    f_pct: (f / total) * 100,
  };
}

/**
 * Meal scheduling window. Source plans often bunch every meal into the morning
 * and early afternoon (last meal at 3–5 PM), and the times are inconsistent day
 * to day. Instead we spread a day's meals evenly across a realistic eating
 * window so the first is an early-morning drink and the LAST is dinner at 9 PM —
 * every day, regardless of how many meals it has.
 */
const DAY_START_MIN = 6 * 60; // 06:00
const DAY_END_MIN = 21 * 60; // 21:00

const minToHHMM = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

/**
 * Evenly-spaced meal times from 06:00 to 21:00 for `count` meals. Endpoints are
 * pinned (first = 06:00, last = 21:00); interior times round to the nearest 5
 * minutes so they read cleanly.
 */
function distributeMealTimes(count: number): string[] {
  if (count <= 0) return [];
  if (count === 1) return ["13:00"]; // a lone meal → midday
  const span = DAY_END_MIN - DAY_START_MIN;
  return Array.from({ length: count }, (_, i) => {
    if (i === 0) return minToHHMM(DAY_START_MIN);
    if (i === count - 1) return minToHHMM(DAY_END_MIN);
    const raw = DAY_START_MIN + (span * i) / (count - 1);
    return minToHHMM(Math.round(raw / 5) * 5);
  });
}

/**
 * Some source plans append non-food rows to each day — greetings ("Goodnight!"),
 * activity/lifestyle notes ("Walk 30 mins after dinner"), hydration reminders —
 * which the extractor sometimes turns into a bogus "Meal 8". They are not meals
 * and contribute nothing to a macro report, so drop them.
 */
const NON_MEAL_PATTERNS: RegExp[] = [
  /\bgood[ -]?(night|morning|evening|day)\b/i,
  /\bwalk(ing)?\b/i,
  /\bjog(ging)?\b/i,
  /\brun(ning)?\b/i,
  /\byoga\b/i,
  /\b(exercise|workout|cardio|gym|stretch|steps|meditat|pranayam)\w*/i,
  /\b(sleep|nap|wake up|rest well|relax)\b/i,
];

function isRealMeal(m: DietMeal): boolean {
  const foods = (m.foods ?? "").trim();
  if (!foods) return false; // no foods listed → not a meal

  // Drop clear non-food rows some plans append to a day — greetings and
  // activity/lifestyle notes ("Goodnight! Walk 30 mins after dinner"). These
  // carry no real energy, so we only treat a keyword match as a non-meal when
  // the row is also near-zero calories. This deliberately KEEPS legitimate
  // zero-calorie drinks (e.g. "Elaichi Water", "Warm water", green tea), which
  // are real scheduled meals — dropping those was making reports start at
  // "Meal 2" instead of Meal 1.
  const text = `${m.name ?? ""} ${foods}`;
  if (m.calories < 50 && NON_MEAL_PATTERNS.some((re) => re.test(text))) return false;

  return true;
}

/** Turn the stored report into everything the views need to render. */
export function deriveWeekly(report: DietReport): WeeklyView {
  const days: DayView[] = report.days.map((day) => {
    const realMeals = day.meals.filter(isRealMeal);

    const total = realMeals.reduce<MacroTotal>((acc, m) => {
      acc.calories += kcalFromMacros(m);
      acc.protein_g += m.protein_g;
      acc.carbs_g += m.carbs_g;
      acc.fats_g += m.fats_g;
      return acc;
    }, emptyTotal());

    // Spread this day's meals evenly across 06:00–21:00 (see distributeMealTimes)
    // so every day ends with dinner at 9 PM instead of the source's 3–5 PM.
    const times = distributeMealTimes(realMeals.length);
    const meals: MealRow[] = realMeals.map((m, i) => {
      const calories = kcalFromMacros(m);
      return {
        ...m,
        calories,
        time: times[i],
        cal_pct: total.calories > 0 ? (calories / total.calories) * 100 : 0,
      };
    });

    return { label: prettyDayLabel(day.label), meals, total };
  });

  const periodLabel = derivePeriodLabel(
    report.days.map((d) => d.label),
    report.client.period_label,
  );

  const summary: MacroSplitRow[] = days.map((d) => ({
    label: d.label,
    ...d.total,
    ...macroSplit(d.total.protein_g, d.total.carbs_g, d.total.fats_g),
  }));

  let average: MacroSplitRow | null = null;
  if (days.length > 0) {
    const n = days.length;
    const sum = days.reduce<MacroTotal>((acc, d) => {
      acc.calories += d.total.calories;
      acc.protein_g += d.total.protein_g;
      acc.carbs_g += d.total.carbs_g;
      acc.fats_g += d.total.fats_g;
      return acc;
    }, emptyTotal());

    const avg: MacroTotal = {
      calories: sum.calories / n,
      protein_g: sum.protein_g / n,
      carbs_g: sum.carbs_g / n,
      fats_g: sum.fats_g / n,
    };

    average = {
      label: "Weekly Avg",
      ...avg,
      ...macroSplit(avg.protein_g, avg.carbs_g, avg.fats_g),
    };
  }

  return { days, summary, average, periodLabel };
}
