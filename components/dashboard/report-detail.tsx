import {
  Flame,
  Dumbbell,
  Droplets,
  Moon,
  Pill,
  Salad,
  Activity,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { DietReport } from "@/lib/schemas";

const num = (n: number | null | undefined, suffix = "") =>
  n === null || n === undefined || Number.isNaN(n)
    ? "—"
    : `${Math.round(n).toLocaleString("en-US")}${suffix}`;

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <span className="flex size-8 items-center justify-center rounded-md bg-brand-yellow/20">
          <Icon className="size-4 text-brand-black" />
        </span>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function MacroBar({ name, grams, pct, color }: { name: string; grams: number; pct: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{name}</span>
        <span className="text-muted-foreground">
          {num(grams, " g")} · {num(pct, "%")}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function ReportDetail({ report }: { report: DietReport }) {
  const { overview, calories, macros } = report;

  return (
    <div className="space-y-6">
      <Section icon={Activity} title="Overview">
        {overview.dietary_pattern ? (
          <Badge variant="brand" className="mb-3">
            {overview.dietary_pattern}
          </Badge>
        ) : null}
        <p className="text-sm text-muted-foreground">{overview.summary}</p>
        {overview.key_highlights.length > 0 ? (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {overview.key_highlights.map((h, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-yellow" />
                {h}
              </li>
            ))}
          </ul>
        ) : null}
      </Section>

      <div className="grid gap-6 md:grid-cols-2">
        <Section icon={Flame} title="Daily Energy">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-brand-black p-3 text-white">
              <p className="text-2xl font-bold text-brand-yellow">
                {num(calories.daily_target_kcal)}
              </p>
              <p className="text-[11px] uppercase tracking-wide text-white/60">Target kcal</p>
            </div>
            <div className="rounded-lg bg-secondary p-3">
              <p className="text-2xl font-bold">{num(calories.maintenance_kcal)}</p>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Maintenance</p>
            </div>
            <div className="rounded-lg bg-secondary p-3">
              <p className="text-2xl font-bold">
                {calories.deficit_or_surplus_kcal === null
                  ? "—"
                  : num(Math.abs(calories.deficit_or_surplus_kcal))}
              </p>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {calories.deficit_or_surplus_kcal !== null && calories.deficit_or_surplus_kcal < 0
                  ? "Deficit"
                  : "Surplus"}
              </p>
            </div>
          </div>
          {calories.notes ? (
            <p className="mt-3 text-sm text-muted-foreground">{calories.notes}</p>
          ) : null}
        </Section>

        <Section icon={Salad} title="Macronutrients">
          <div className="space-y-3">
            <MacroBar name="Protein" grams={macros.protein_g} pct={macros.protein_pct} color="#0A0A0A" />
            <MacroBar name="Carbohydrates" grams={macros.carbs_g} pct={macros.carbs_pct} color="#FFD400" />
            <MacroBar name="Fats" grams={macros.fats_g} pct={macros.fats_pct} color="#8A8A8A" />
          </div>
          {macros.fiber_g !== null ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Fiber target: {num(macros.fiber_g, " g")}/day
            </p>
          ) : null}
        </Section>
      </div>

      {report.micronutrients.length > 0 ? (
        <Section icon={Pill} title="Micronutrients to Monitor">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nutrient</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.micronutrients.map((m, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell>{m.amount || "—"}</TableCell>
                  <TableCell className="capitalize">{m.status ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{m.note || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>
      ) : null}

      {report.meals.length > 0 ? (
        <Section icon={Salad} title="Meal Plan">
          <div className="grid gap-3 sm:grid-cols-2">
            {report.meals.map((meal, i) => (
              <div key={i} className="rounded-lg border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-semibold">{meal.name}</p>
                  <span className="text-xs text-muted-foreground">
                    {[meal.time, meal.approx_kcal !== null ? `${num(meal.approx_kcal)} kcal` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {meal.items.map((it, j) => (
                    <li key={j} className="flex gap-2">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-brand-yellow" />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <Section icon={Dumbbell} title="Training">
          {report.workout.focus ? (
            <p className="mb-3 text-sm font-medium">{report.workout.focus}</p>
          ) : null}
          {report.workout.weekly_split.length > 0 ? (
            <div className="mb-3 space-y-2">
              {report.workout.weekly_split.map((d, i) => (
                <div key={i} className="rounded-md border p-2 text-sm">
                  <span className="font-medium">{d.day}</span> — {d.focus}
                  {d.details ? (
                    <p className="text-xs text-muted-foreground">{d.details}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
          <ul className="space-y-1 text-sm text-muted-foreground">
            {report.workout.recommendations.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-brand-yellow" />
                {r}
              </li>
            ))}
          </ul>
        </Section>

        <div className="space-y-6">
          <Section icon={Droplets} title="Hydration">
            {report.hydration.daily_water_liters !== null ? (
              <p className="mb-2 text-2xl font-bold">
                {report.hydration.daily_water_liters}{" "}
                <span className="text-sm font-normal text-muted-foreground">litres/day</span>
              </p>
            ) : null}
            <ul className="space-y-1 text-sm text-muted-foreground">
              {report.hydration.recommendations.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-brand-yellow" />
                  {r}
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={Moon} title="Recovery">
            {report.recovery.sleep_hours ? (
              <p className="mb-2 text-sm">
                <span className="font-medium">Sleep:</span> {report.recovery.sleep_hours}
              </p>
            ) : null}
            <ul className="space-y-1 text-sm text-muted-foreground">
              {report.recovery.recommendations.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-brand-yellow" />
                  {r}
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>

      {report.supplements.length > 0 ? (
        <Section icon={Pill} title="Supplement Suggestions">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplement</TableHead>
                <TableHead>Dosage</TableHead>
                <TableHead>Timing</TableHead>
                <TableHead>Purpose</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.supplements.map((s, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.dosage || "—"}</TableCell>
                  <TableCell>{s.timing || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{s.purpose || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>
      ) : null}

      {report.disclaimers.length > 0 ? (
        <div className="rounded-xl border-l-4 border-brand-yellow bg-muted/40 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <ShieldAlert className="size-4" /> Important
          </div>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {report.disclaimers.map((d, i) => (
              <li key={i}>• {d}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
