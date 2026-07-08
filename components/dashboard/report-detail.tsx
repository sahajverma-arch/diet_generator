import { CalendarRange, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DietReport } from "@/lib/schemas";
import {
  deriveWeekly,
  normalizeDietPreference,
  type DayView,
  type MacroSplitRow,
} from "@/lib/report-macros";
import {
  assessIcmr,
  ICMR,
  ICMR_CITATION,
  fmtRange,
  statusLabel,
  type DayAssessment,
  type IcmrStatus,
} from "@/lib/icmr";

const r = (n: number) => String(Math.round(n));
const g = (n: number) => `${Math.round(n)}g`;
const pct = (n: number) => `${Math.round(n)}%`;

const MACRO = {
  protein: "#0A0A0A",
  carbs: "#FFD400",
  fat: "#8A8A8A",
} as const;

function DayCard({ day }: { day: DayView }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-brand-black px-4 py-2.5">
        <p className="font-bold text-white">{day.label}</p>
        <p className="text-sm font-semibold text-brand-yellow">
          {r(day.total.calories)} kcal &nbsp;|&nbsp; P {g(day.total.protein_g)} &nbsp;|&nbsp; C{" "}
          {g(day.total.carbs_g)} &nbsp;|&nbsp; F {g(day.total.fats_g)}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="bg-muted/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2 font-semibold">Time</th>
              <th className="px-3 py-2 font-semibold">Meal</th>
              <th className="px-3 py-2 font-semibold">Foods</th>
              <th className="px-3 py-2 text-right font-semibold">Cal</th>
              <th className="px-3 py-2 text-right font-semibold">Protein</th>
              <th className="px-3 py-2 text-right font-semibold">Carbs</th>
              <th className="px-3 py-2 text-right font-semibold">Fat</th>
              <th className="px-3 py-2 text-right font-semibold">Cal%</th>
            </tr>
          </thead>
          <tbody>
            {day.meals.map((m, i) => (
              <tr key={i} className="border-t">
                <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{m.time || "—"}</td>
                <td className="whitespace-nowrap px-3 py-2 font-medium">{m.name || "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">{m.foods || "—"}</td>
                <td className="px-3 py-2 text-right">{r(m.calories)}</td>
                <td className="px-3 py-2 text-right">{g(m.protein_g)}</td>
                <td className="px-3 py-2 text-right">{g(m.carbs_g)}</td>
                <td className="px-3 py-2 text-right">{g(m.fats_g)}</td>
                <td className="px-3 py-2 text-right text-muted-foreground">{pct(m.cal_pct)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-brand-black bg-brand-yellow/20 font-bold">
              <td className="px-3 py-2" colSpan={3}>
                Daily Total
              </td>
              <td className="px-3 py-2 text-right">{r(day.total.calories)}</td>
              <td className="px-3 py-2 text-right">{g(day.total.protein_g)}</td>
              <td className="px-3 py-2 text-right">{g(day.total.carbs_g)}</td>
              <td className="px-3 py-2 text-right">{g(day.total.fats_g)}</td>
              <td className="px-3 py-2 text-right">100%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function SummaryTable({ summary, average }: { summary: MacroSplitRow[]; average: MacroSplitRow | null }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b bg-muted/40 px-4 py-3">
        <h3 className="flex items-center gap-2 font-bold">
          <span className="h-4 w-1 rounded bg-brand-yellow" /> Weekly Summary
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="bg-muted/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2 font-semibold">Day</th>
              <th className="px-3 py-2 text-right font-semibold">Calories</th>
              <th className="px-3 py-2 text-right font-semibold">Protein (g)</th>
              <th className="px-3 py-2 text-right font-semibold">Carbs (g)</th>
              <th className="px-3 py-2 text-right font-semibold">Fat (g)</th>
              <th className="px-3 py-2 text-right font-semibold">P%</th>
              <th className="px-3 py-2 text-right font-semibold">C%</th>
              <th className="px-3 py-2 text-right font-semibold">F%</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((row, i) => (
              <tr key={i} className="border-t">
                <td className="whitespace-nowrap px-3 py-2 font-medium">{row.label}</td>
                <td className="px-3 py-2 text-right">{r(row.calories)}</td>
                <td className="px-3 py-2 text-right">{Math.round(row.protein_g)}</td>
                <td className="px-3 py-2 text-right">{Math.round(row.carbs_g)}</td>
                <td className="px-3 py-2 text-right">{Math.round(row.fats_g)}</td>
                <td className="px-3 py-2 text-right text-muted-foreground">{pct(row.p_pct)}</td>
                <td className="px-3 py-2 text-right text-muted-foreground">{pct(row.c_pct)}</td>
                <td className="px-3 py-2 text-right text-muted-foreground">{pct(row.f_pct)}</td>
              </tr>
            ))}
            {average ? (
              <tr className="border-t-2 border-brand-black bg-brand-black font-bold text-white">
                <td className="px-3 py-2 text-brand-yellow">{average.label}</td>
                <td className="px-3 py-2 text-right">{r(average.calories)}</td>
                <td className="px-3 py-2 text-right">{Math.round(average.protein_g)}</td>
                <td className="px-3 py-2 text-right">{Math.round(average.carbs_g)}</td>
                <td className="px-3 py-2 text-right">{Math.round(average.fats_g)}</td>
                <td className="px-3 py-2 text-right">{pct(average.p_pct)}</td>
                <td className="px-3 py-2 text-right">{pct(average.c_pct)}</td>
                <td className="px-3 py-2 text-right">{pct(average.f_pct)}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

const icmrText = (s: IcmrStatus) =>
  s === "within" ? "text-emerald-600" : "text-amber-600";
const icmrBg = (s: IcmrStatus) =>
  s === "within" ? "bg-emerald-600" : "bg-amber-600";

function IcmrPanel({ assessment }: { assessment: ReturnType<typeof assessIcmr> }) {
  const { average, days, compliantDays, totalDays } = assessment;
  return (
    <Card className="overflow-hidden">
      <div className="border-b bg-muted/40 px-4 py-3">
        <h3 className="flex items-center gap-2 font-bold">
          <ShieldCheck className="size-4 text-brand-black" /> ICMR Alignment
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Assessed against {ICMR_CITATION}. Based on the share of energy from each macronutrient
          (4 kcal/g protein &amp; carbs, 9 kcal/g fat).
        </p>
      </div>

      <CardContent className="space-y-5 p-4">
        {average ? (
          <div>
            <p className="mb-2 text-sm font-semibold">Weekly average vs ICMR ranges</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="py-1.5 pr-3 font-semibold">Macronutrient</th>
                    <th className="py-1.5 pr-3 text-right font-semibold">Plan (avg)</th>
                    <th className="py-1.5 pr-3 text-center font-semibold">ICMR Range</th>
                    <th className="py-1.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {average.checks.map((c, i) => (
                    <tr key={i} className="border-t">
                      <td className="py-1.5 pr-3 font-medium">{c.label}</td>
                      <td className={`py-1.5 pr-3 text-right font-semibold ${icmrText(c.status)}`}>
                        {c.actualPct}%
                      </td>
                      <td className="py-1.5 pr-3 text-center text-muted-foreground">
                        {fmtRange(c.range)}
                      </td>
                      <td className="py-1.5">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold text-white ${icmrBg(c.status)}`}
                        >
                          {statusLabel(c.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t">
                    <td className="py-1.5 pr-3 font-medium">Min. carbohydrate</td>
                    <td
                      className={`py-1.5 pr-3 text-right font-semibold ${icmrText(average.minCarbStatus)}`}
                    >
                      {Math.round(average.carbsGrams)} g
                    </td>
                    <td className="py-1.5 pr-3 text-center text-muted-foreground">
                      {ICMR.minCarbsGramsPerDay}–{ICMR.minCarbsGramsPerDayUpper} g
                    </td>
                    <td className="py-1.5">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold text-white ${icmrBg(average.minCarbStatus)}`}
                      >
                        {statusLabel(average.minCarbStatus)}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        <div>
          <p className="mb-2 text-sm font-semibold">Day-by-day compliance</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="py-1.5 pr-3 font-semibold">Day</th>
                  <th className="py-1.5 pr-3 text-right font-semibold">P%</th>
                  <th className="py-1.5 pr-3 text-right font-semibold">C%</th>
                  <th className="py-1.5 pr-3 text-right font-semibold">F%</th>
                  <th className="py-1.5 pr-3 text-right font-semibold">Carbs</th>
                  <th className="py-1.5 font-semibold">Verdict</th>
                </tr>
              </thead>
              <tbody>
                {days.map((d: DayAssessment, i) => (
                  <tr key={i} className="border-t">
                    <td className="whitespace-nowrap py-1.5 pr-3 font-medium">{d.label}</td>
                    <td className={`py-1.5 pr-3 text-right ${icmrText(d.checks[0].status)}`}>
                      {d.checks[0].actualPct}%
                    </td>
                    <td className={`py-1.5 pr-3 text-right ${icmrText(d.checks[1].status)}`}>
                      {d.checks[1].actualPct}%
                    </td>
                    <td className={`py-1.5 pr-3 text-right ${icmrText(d.checks[2].status)}`}>
                      {d.checks[2].actualPct}%
                    </td>
                    <td className={`py-1.5 pr-3 text-right ${icmrText(d.minCarbStatus)}`}>
                      {Math.round(d.carbsGrams)}g
                    </td>
                    <td className="py-1.5">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className={`size-2 rounded-full ${d.compliant ? "bg-emerald-600" : "bg-amber-600"}`}
                        />
                        <span
                          className={`text-xs font-semibold ${d.compliant ? "text-emerald-600" : "text-amber-600"}`}
                        >
                          {d.compliant ? "Within" : "Review"}
                        </span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-sm font-semibold">
            {compliantDays} of {totalDays} day{totalDays === 1 ? "" : "s"} fall within all ICMR macro
            ranges.
          </p>
        </div>

        <div className="rounded-lg border-l-4 border-brand-yellow bg-muted/40 p-3">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            ICMR reference limits (not measured from this plan)
          </p>
          <ul className="space-y-0.5 text-xs text-muted-foreground">
            <li>• Added sugar below {ICMR.addedSugarMaxPctEnergy}% of energy</li>
            <li>
              • Saturated fat below {ICMR.saturatedFatMaxPctEnergy}% of energy; trans-fat near zero
            </li>
            <li>• Dietary fibre {ICMR.fiberGramsPer2000Kcal} g per 2000 kcal</li>
            <li>• Salt below {ICMR.saltMaxGramsPerDay} g/day</li>
            <li>
              • Protein RDA {ICMR.proteinRdaGramsPerKg} g/kg body weight/day (needs body weight for a
              per-client check)
            </li>
          </ul>
        </div>

        <p className="text-xs italic text-muted-foreground">
          Source: {ICMR_CITATION}. Macro ranges are general adult guidance; a clinically prescribed
          therapeutic plan may intentionally deviate.
        </p>
      </CardContent>
    </Card>
  );
}

export function ReportDetail({ report }: { report: DietReport }) {
  const { client } = report;
  const weekly = deriveWeekly(report);
  const { days, summary, average } = weekly;
  const icmr = assessIcmr(weekly);

  const dietPreference = normalizeDietPreference(client.diet_preference);
  const planBits = [client.plan_name, dietPreference, client.medical_condition].filter(Boolean);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-wrap items-start justify-between gap-4 p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Weekly Diet Macro Report
            </p>
            <h2 className="mt-1 text-xl font-bold">{client.name}</h2>
            {weekly.periodLabel ? (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarRange className="size-4" /> {weekly.periodLabel}
              </p>
            ) : null}
            {planBits.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {planBits.map((b, i) => (
                  <Badge key={i} variant="brand">
                    {b}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded" style={{ backgroundColor: MACRO.protein }} /> Protein
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded" style={{ backgroundColor: MACRO.carbs }} /> Carbs
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded" style={{ backgroundColor: MACRO.fat }} /> Fat
            </span>
          </div>
        </CardContent>
      </Card>

      {days.length > 0 ? (
        days.map((day, i) => <DayCard key={i} day={day} />)
      ) : (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No daily meal data could be extracted from this document.
          </CardContent>
        </Card>
      )}

      {summary.length > 0 ? <SummaryTable summary={summary} average={average} /> : null}

      {summary.length > 0 ? <IcmrPanel assessment={icmr} /> : null}

      <p className="text-xs italic text-muted-foreground">
        {report.notes?.trim() || "Macros are estimated values based on standard portion sizes."}
      </p>
    </div>
  );
}
