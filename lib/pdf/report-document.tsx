/* eslint-disable jsx-a11y/alt-text -- @react-pdf/renderer's <Image> is not an HTML img and has no alt prop. */
import React from "react";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
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
import { BRAND, APP_NAME } from "@/lib/theme";

/* -------------------------------------------------------------------------- */
/*  Column layout                                                              */
/* -------------------------------------------------------------------------- */

// Relative widths for the daily meal table (8 columns). "Foods" gets the slack.
const COL = {
  time: 1.05,
  meal: 1.05,
  foods: 3.7,
  cal: 1.0,
  protein: 0.95,
  carbs: 0.9,
  fat: 0.85,
  calpct: 0.85,
} as const;

// Relative widths for the weekly summary table (8 columns).
const SUM = {
  day: 2.6,
  cal: 1.1,
  protein: 1.1,
  carbs: 1.0,
  fat: 0.95,
  ppct: 0.85,
  cpct: 0.85,
  fpct: 0.85,
} as const;

/* -------------------------------------------------------------------------- */
/*  Styles                                                                     */
/* -------------------------------------------------------------------------- */

const MACRO = {
  protein: BRAND.black,
  carbs: BRAND.yellow,
  fat: BRAND.slate,
} as const;

// Semantic colours for ICMR status (kept local; brand palette is yellow/black).
const STATUS = {
  within: "#1E874B", // green — meets the ICMR range
  flag: "#B9770B", // amber — outside the ICMR range (above or below)
} as const;
const statusColor = (s: IcmrStatus) => (s === "within" ? STATUS.within : STATUS.flag);

const styles = StyleSheet.create({
  page: {
    backgroundColor: BRAND.white,
    color: BRAND.ink,
    fontFamily: "Helvetica",
    fontSize: 8.5,
    // Clear the fixed running header: its bottom border sits at ~47pt, so start
    // page content below it to avoid the line cutting through the title.
    paddingTop: 66,
    paddingBottom: 42,
    paddingHorizontal: 34,
    lineHeight: 1.35,
  },

  // Running header / footer
  header: {
    position: "absolute",
    top: 16,
    left: 34,
    right: 34,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: BRAND.line,
    paddingBottom: 6,
  },
  headerLogoChip: {
    backgroundColor: BRAND.black,
    borderRadius: 4,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  headerLogo: { width: 60, height: 19, objectFit: "contain" },
  headerBrand: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 3,
    color: BRAND.black,
  },
  headerBrandDot: { color: BRAND.yellow },
  headerRight: { fontSize: 7.5, color: BRAND.mute, letterSpacing: 0.8 },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 34,
    right: 34,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: BRAND.line,
    paddingTop: 6,
  },
  footerText: { fontSize: 6.8, color: BRAND.mute, maxWidth: 470 },
  footerPage: { fontSize: 6.8, color: BRAND.mute },

  // Title block
  title: {
    fontSize: 19,
    fontFamily: "Helvetica-Bold",
    color: BRAND.black,
    lineHeight: 1.15,
  },
  titleAccent: { color: BRAND.yellow },
  period: { fontSize: 10, color: BRAND.slate, marginTop: 3 },
  planLine: { fontSize: 8.5, color: BRAND.mute, marginTop: 4, letterSpacing: 0.3 },

  // Macro legend
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 12,
    marginBottom: 4,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.line,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 9, height: 9, borderRadius: 2 },
  legendLabel: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: BRAND.ink },
  legendNote: { fontSize: 7.5, color: BRAND.mute, fontStyle: "italic" },

  // Day block
  dayBlock: { marginTop: 14 },
  dayHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: BRAND.black,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  dayName: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: BRAND.white },
  dayMacros: { fontSize: 8.5, color: BRAND.yellow, fontFamily: "Helvetica-Bold" },

  // Tables (shared)
  table: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: BRAND.line,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    overflow: "hidden",
  },
  tableStandalone: {
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 5,
    overflow: "hidden",
  },
  headRow: { flexDirection: "row", backgroundColor: BRAND.offwhite },
  headCell: {
    fontSize: 6.8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.4,
    color: BRAND.mute,
    textTransform: "uppercase",
    paddingVertical: 4,
    paddingHorizontal: 5,
  },
  row: { flexDirection: "row", borderTopWidth: 1, borderTopColor: BRAND.line },
  rowAlt: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: BRAND.line,
    backgroundColor: "#FCFCFA",
  },
  cell: { fontSize: 8, color: BRAND.slate, paddingVertical: 4, paddingHorizontal: 5 },
  cellStrong: {
    fontSize: 8,
    color: BRAND.ink,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 4,
    paddingHorizontal: 5,
  },
  num: { textAlign: "right" },

  // Daily total row
  totalRow: {
    flexDirection: "row",
    borderTopWidth: 1.2,
    borderTopColor: BRAND.ink,
    backgroundColor: BRAND.yellowTint,
  },
  totalCell: {
    fontSize: 8,
    color: BRAND.black,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 4,
    paddingHorizontal: 5,
  },

  // Weekly summary
  summaryHead: { flexDirection: "row", alignItems: "center", marginTop: 22, marginBottom: 8 },
  summaryAccent: {
    width: 4,
    height: 15,
    backgroundColor: BRAND.yellow,
    marginRight: 7,
    borderRadius: 2,
  },
  summaryTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", color: BRAND.black },
  avgRow: {
    flexDirection: "row",
    borderTopWidth: 1.2,
    borderTopColor: BRAND.ink,
    backgroundColor: BRAND.black,
  },
  avgCell: {
    fontSize: 8,
    color: BRAND.white,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 5,
    paddingHorizontal: 5,
  },
  avgCellAccent: {
    fontSize: 8,
    color: BRAND.yellow,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 5,
    paddingHorizontal: 5,
  },

  // ICMR alignment
  icmrIntro: { fontSize: 7.8, color: BRAND.mute, marginBottom: 8, lineHeight: 1.3 },
  subHead: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: BRAND.ink,
    marginTop: 10,
    marginBottom: 5,
  },
  pill: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingVertical: 1.5,
    paddingHorizontal: 6,
  },
  pillText: { fontSize: 7, fontFamily: "Helvetica-Bold", color: BRAND.white },
  verdictWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
  verdictDot: { width: 6, height: 6, borderRadius: 3 },
  complianceLine: {
    fontSize: 8.5,
    color: BRAND.ink,
    fontFamily: "Helvetica-Bold",
    marginTop: 8,
  },
  refBox: {
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: BRAND.yellow,
    backgroundColor: BRAND.offwhite,
    padding: 9,
    borderRadius: 4,
  },
  refTitle: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
    color: BRAND.slate,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  refItem: { fontSize: 7.5, color: BRAND.mute, marginBottom: 2 },
  citation: { fontSize: 7, color: BRAND.mute, marginTop: 8, fontStyle: "italic" },
});

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const r = (n: number) => String(Math.round(n));
const g = (n: number) => `${Math.round(n)}g`;
const pct = (n: number) => `${Math.round(n)}%`;

/* -------------------------------------------------------------------------- */
/*  Small components                                                           */
/* -------------------------------------------------------------------------- */

function PageChrome({
  clientName,
  logoDataUri,
  footerLine,
}: {
  clientName: string;
  logoDataUri?: string;
  footerLine: string;
}) {
  return (
    <>
      <View style={styles.header} fixed>
        {logoDataUri ? (
          <View style={styles.headerLogoChip}>
            <Image style={styles.headerLogo} src={logoDataUri} />
          </View>
        ) : (
          <Text style={styles.headerBrand}>
            {APP_NAME}
            <Text style={styles.headerBrandDot}>.</Text>
          </Text>
        )}
        <Text style={styles.headerRight}>
          WEEKLY DIET MACRO REPORT · {clientName.toUpperCase()}
        </Text>
      </View>
      <View style={styles.footer} fixed>
        <Text style={styles.footerText}>{footerLine}</Text>
        <Text
          style={styles.footerPage}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        />
      </View>
    </>
  );
}

function LegendDot({ color }: { color: string }) {
  return <View style={[styles.legendDot, { backgroundColor: color }]} />;
}

function DayTable({ day }: { day: DayView }) {
  return (
    <View style={styles.dayBlock} wrap={false}>
      <View style={styles.dayHead}>
        <Text style={styles.dayName}>{day.label}</Text>
        <Text style={styles.dayMacros}>
          {r(day.total.calories)} kcal | P {g(day.total.protein_g)} | C{" "}
          {g(day.total.carbs_g)} | F {g(day.total.fats_g)}
        </Text>
      </View>

      <View style={styles.table}>
        {/* Column headers */}
        <View style={styles.headRow}>
          <Text style={[styles.headCell, { flex: COL.time }]}>Time</Text>
          <Text style={[styles.headCell, { flex: COL.meal }]}>Meal</Text>
          <Text style={[styles.headCell, { flex: COL.foods }]}>Foods</Text>
          <Text style={[styles.headCell, styles.num, { flex: COL.cal }]}>Cal</Text>
          <Text style={[styles.headCell, styles.num, { flex: COL.protein }]}>Protein</Text>
          <Text style={[styles.headCell, styles.num, { flex: COL.carbs }]}>Carbs</Text>
          <Text style={[styles.headCell, styles.num, { flex: COL.fat }]}>Fat</Text>
          <Text style={[styles.headCell, styles.num, { flex: COL.calpct }]}>Cal%</Text>
        </View>

        {/* Meal rows */}
        {day.meals.map((m, i) => (
          <View key={i} style={i % 2 ? styles.rowAlt : styles.row}>
            <Text style={[styles.cell, { flex: COL.time }]}>{m.time || "—"}</Text>
            <Text style={[styles.cellStrong, { flex: COL.meal }]}>{m.name || "—"}</Text>
            <Text style={[styles.cell, { flex: COL.foods }]}>{m.foods || "—"}</Text>
            <Text style={[styles.cell, styles.num, { flex: COL.cal }]}>{r(m.calories)}</Text>
            <Text style={[styles.cell, styles.num, { flex: COL.protein }]}>{g(m.protein_g)}</Text>
            <Text style={[styles.cell, styles.num, { flex: COL.carbs }]}>{g(m.carbs_g)}</Text>
            <Text style={[styles.cell, styles.num, { flex: COL.fat }]}>{g(m.fats_g)}</Text>
            <Text style={[styles.cell, styles.num, { flex: COL.calpct }]}>{pct(m.cal_pct)}</Text>
          </View>
        ))}

        {/* Daily total */}
        <View style={styles.totalRow}>
          <Text style={[styles.totalCell, { flex: COL.time + COL.meal + COL.foods }]}>
            Daily Total
          </Text>
          <Text style={[styles.totalCell, styles.num, { flex: COL.cal }]}>
            {r(day.total.calories)}
          </Text>
          <Text style={[styles.totalCell, styles.num, { flex: COL.protein }]}>
            {g(day.total.protein_g)}
          </Text>
          <Text style={[styles.totalCell, styles.num, { flex: COL.carbs }]}>
            {g(day.total.carbs_g)}
          </Text>
          <Text style={[styles.totalCell, styles.num, { flex: COL.fat }]}>
            {g(day.total.fats_g)}
          </Text>
          <Text style={[styles.totalCell, styles.num, { flex: COL.calpct }]}>100%</Text>
        </View>
      </View>
    </View>
  );
}

function SummaryRow({ row, alt }: { row: MacroSplitRow; alt: boolean }) {
  return (
    <View style={alt ? styles.rowAlt : styles.row}>
      <Text style={[styles.cellStrong, { flex: SUM.day }]}>{row.label}</Text>
      <Text style={[styles.cell, styles.num, { flex: SUM.cal }]}>{r(row.calories)}</Text>
      <Text style={[styles.cell, styles.num, { flex: SUM.protein }]}>{Math.round(row.protein_g)}</Text>
      <Text style={[styles.cell, styles.num, { flex: SUM.carbs }]}>{Math.round(row.carbs_g)}</Text>
      <Text style={[styles.cell, styles.num, { flex: SUM.fat }]}>{Math.round(row.fats_g)}</Text>
      <Text style={[styles.cell, styles.num, { flex: SUM.ppct }]}>{pct(row.p_pct)}</Text>
      <Text style={[styles.cell, styles.num, { flex: SUM.cpct }]}>{pct(row.c_pct)}</Text>
      <Text style={[styles.cell, styles.num, { flex: SUM.fpct }]}>{pct(row.f_pct)}</Text>
    </View>
  );
}

function StatusPill({ status }: { status: IcmrStatus }) {
  return (
    <View style={[styles.pill, { backgroundColor: statusColor(status) }]}>
      <Text style={styles.pillText}>{statusLabel(status)}</Text>
    </View>
  );
}

/** Macronutrient scorecard for a single row (used for the weekly average). */
function IcmrScorecard({ a }: { a: DayAssessment }) {
  return (
    <View style={styles.tableStandalone}>
      <View style={styles.headRow}>
        <Text style={[styles.headCell, { flex: 2.2 }]}>Macronutrient</Text>
        <Text style={[styles.headCell, styles.num, { flex: 1.3 }]}>Plan (avg)</Text>
        <Text style={[styles.headCell, { flex: 1.7, textAlign: "center" }]}>ICMR Range</Text>
        <Text style={[styles.headCell, { flex: 1.5 }]}>Status</Text>
      </View>
      {a.checks.map((c, i) => (
        <View key={i} style={i % 2 ? styles.rowAlt : styles.row}>
          <Text style={[styles.cellStrong, { flex: 2.2 }]}>{c.label}</Text>
          <Text style={[styles.cell, styles.num, { flex: 1.3, color: statusColor(c.status) }]}>
            {c.actualPct}%
          </Text>
          <Text style={[styles.cell, { flex: 1.7, textAlign: "center" }]}>{fmtRange(c.range)}</Text>
          <View style={[styles.cell, { flex: 1.5 }]}>
            <StatusPill status={c.status} />
          </View>
        </View>
      ))}
      <View style={a.checks.length % 2 ? styles.rowAlt : styles.row}>
        <Text style={[styles.cellStrong, { flex: 2.2 }]}>Min. carbohydrate</Text>
        <Text style={[styles.cell, styles.num, { flex: 1.3, color: statusColor(a.minCarbStatus) }]}>
          {Math.round(a.carbsGrams)} g
        </Text>
        <Text style={[styles.cell, { flex: 1.7, textAlign: "center" }]}>
          {ICMR.minCarbsGramsPerDay}–{ICMR.minCarbsGramsPerDayUpper} g
        </Text>
        <View style={[styles.cell, { flex: 1.5 }]}>
          <StatusPill status={a.minCarbStatus} />
        </View>
      </View>
    </View>
  );
}

/** Day-by-day compliance table (macro %s coloured by ICMR status + a verdict). */
function IcmrPerDay({ days }: { days: DayAssessment[] }) {
  return (
    <View style={styles.tableStandalone}>
      <View style={styles.headRow}>
        <Text style={[styles.headCell, { flex: 2.4 }]}>Day</Text>
        <Text style={[styles.headCell, styles.num, { flex: 1.05 }]}>P%</Text>
        <Text style={[styles.headCell, styles.num, { flex: 1.05 }]}>C%</Text>
        <Text style={[styles.headCell, styles.num, { flex: 1.0 }]}>F%</Text>
        <Text style={[styles.headCell, styles.num, { flex: 1.15 }]}>Carbs</Text>
        <Text style={[styles.headCell, { flex: 1.5 }]}>Verdict</Text>
      </View>
      {days.map((d, i) => (
        <View key={i} style={i % 2 ? styles.rowAlt : styles.row}>
          <Text style={[styles.cellStrong, { flex: 2.4 }]}>{d.label}</Text>
          <Text style={[styles.cell, styles.num, { flex: 1.05, color: statusColor(d.checks[0].status) }]}>
            {d.checks[0].actualPct}%
          </Text>
          <Text style={[styles.cell, styles.num, { flex: 1.05, color: statusColor(d.checks[1].status) }]}>
            {d.checks[1].actualPct}%
          </Text>
          <Text style={[styles.cell, styles.num, { flex: 1.0, color: statusColor(d.checks[2].status) }]}>
            {d.checks[2].actualPct}%
          </Text>
          <Text style={[styles.cell, styles.num, { flex: 1.15, color: statusColor(d.minCarbStatus) }]}>
            {Math.round(d.carbsGrams)}g
          </Text>
          <View style={[styles.cell, { flex: 1.5 }]}>
            <View style={styles.verdictWrap}>
              <View
                style={[
                  styles.verdictDot,
                  { backgroundColor: d.compliant ? STATUS.within : STATUS.flag },
                ]}
              />
              <Text
                style={{
                  fontSize: 7.5,
                  fontFamily: "Helvetica-Bold",
                  color: d.compliant ? STATUS.within : STATUS.flag,
                }}
              >
                {d.compliant ? "Within" : "Review"}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  Document                                                                   */
/* -------------------------------------------------------------------------- */

export interface ReportDocumentProps {
  report: DietReport;
  logoDataUri?: string;
  generatedAt: string; // pre-formatted date string
  reportId: string;
}

export function ReportDocument({ report, logoDataUri }: ReportDocumentProps) {
  const { client } = report;
  const weekly = deriveWeekly(report);
  const { days, summary, average } = weekly;
  const icmr = assessIcmr(weekly);

  const dietPreference = normalizeDietPreference(client.diet_preference);
  const planBits = [client.plan_name, dietPreference, client.medical_condition].filter(Boolean);

  const footerLine = [
    `Generated by ${APP_NAME} Health Platform`,
    dietPreference ? `Diet Preference: ${dietPreference}` : null,
    client.medical_condition ? `Medical Condition: ${client.medical_condition}` : null,
    client.plan_name ? `Plan: ${client.plan_name}` : null,
  ]
    .filter(Boolean)
    .join("  |  ");

  return (
    <Document
      title={`${APP_NAME} Weekly Diet Macro Report — ${client.name}`}
      author={APP_NAME}
      subject="Weekly diet macro report"
    >
      <Page size="A4" style={styles.page}>
        <PageChrome clientName={client.name} logoDataUri={logoDataUri} footerLine={footerLine} />

        {/* Title */}
        <Text style={styles.title}>
          {client.name} <Text style={styles.titleAccent}>—</Text> Weekly Diet Macro Report
        </Text>
        {weekly.periodLabel ? <Text style={styles.period}>{weekly.periodLabel}</Text> : null}
        {planBits.length > 0 ? (
          <Text style={styles.planLine}>Plan: {planBits.join("  |  ")}</Text>
        ) : null}

        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <LegendDot color={MACRO.protein} />
            <Text style={styles.legendLabel}>Protein</Text>
          </View>
          <View style={styles.legendItem}>
            <LegendDot color={MACRO.carbs} />
            <Text style={styles.legendLabel}>Carbohydrates</Text>
          </View>
          <View style={styles.legendItem}>
            <LegendDot color={MACRO.fat} />
            <Text style={styles.legendLabel}>Fat</Text>
          </View>
          <Text style={styles.legendNote}>
            {report.notes?.trim() || "Macros are estimated values based on standard portion sizes."}
          </Text>
        </View>

        {/* Per-day tables */}
        {days.length > 0 ? (
          days.map((day, i) => <DayTable key={i} day={day} />)
        ) : (
          <Text style={[styles.period, { marginTop: 20 }]}>
            No daily meal data could be extracted from this document.
          </Text>
        )}

        {/* Weekly summary */}
        {summary.length > 0 ? (
          <View wrap={false}>
            <View style={styles.summaryHead}>
              <View style={styles.summaryAccent} />
              <Text style={styles.summaryTitle}>Weekly Summary</Text>
            </View>

            <View style={styles.tableStandalone}>
              <View style={styles.headRow}>
                <Text style={[styles.headCell, { flex: SUM.day }]}>Day</Text>
                <Text style={[styles.headCell, styles.num, { flex: SUM.cal }]}>Calories</Text>
                <Text style={[styles.headCell, styles.num, { flex: SUM.protein }]}>Protein (g)</Text>
                <Text style={[styles.headCell, styles.num, { flex: SUM.carbs }]}>Carbs (g)</Text>
                <Text style={[styles.headCell, styles.num, { flex: SUM.fat }]}>Fat (g)</Text>
                <Text style={[styles.headCell, styles.num, { flex: SUM.ppct }]}>P%</Text>
                <Text style={[styles.headCell, styles.num, { flex: SUM.cpct }]}>C%</Text>
                <Text style={[styles.headCell, styles.num, { flex: SUM.fpct }]}>F%</Text>
              </View>

              {summary.map((row, i) => (
                <SummaryRow key={i} row={row} alt={i % 2 === 1} />
              ))}

              {average ? (
                <View style={styles.avgRow}>
                  <Text style={[styles.avgCellAccent, { flex: SUM.day }]}>{average.label}</Text>
                  <Text style={[styles.avgCell, styles.num, { flex: SUM.cal }]}>{r(average.calories)}</Text>
                  <Text style={[styles.avgCell, styles.num, { flex: SUM.protein }]}>{Math.round(average.protein_g)}</Text>
                  <Text style={[styles.avgCell, styles.num, { flex: SUM.carbs }]}>{Math.round(average.carbs_g)}</Text>
                  <Text style={[styles.avgCell, styles.num, { flex: SUM.fat }]}>{Math.round(average.fats_g)}</Text>
                  <Text style={[styles.avgCell, styles.num, { flex: SUM.ppct }]}>{pct(average.p_pct)}</Text>
                  <Text style={[styles.avgCell, styles.num, { flex: SUM.cpct }]}>{pct(average.c_pct)}</Text>
                  <Text style={[styles.avgCell, styles.num, { flex: SUM.fpct }]}>{pct(average.f_pct)}</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* ICMR alignment */}
        {summary.length > 0 ? (
          <View>
            <View style={styles.summaryHead}>
              <View style={styles.summaryAccent} />
              <Text style={styles.summaryTitle}>ICMR Alignment</Text>
            </View>
            <Text style={styles.icmrIntro}>
              Assessed against {ICMR_CITATION}. Based on the share of energy from each macronutrient
              (4 kcal/g protein & carbohydrate, 9 kcal/g fat).
            </Text>

            {icmr.average ? (
              <View wrap={false}>
                <Text style={styles.subHead}>Weekly average vs ICMR ranges</Text>
                <IcmrScorecard a={icmr.average} />
              </View>
            ) : null}

            <View wrap={false}>
              <Text style={styles.subHead}>Day-by-day compliance</Text>
              <IcmrPerDay days={icmr.days} />
              <Text style={styles.complianceLine}>
                {icmr.compliantDays} of {icmr.totalDays} day{icmr.totalDays === 1 ? "" : "s"} fall
                within all ICMR macro ranges.
              </Text>
            </View>

            <View style={styles.refBox} wrap={false}>
              <Text style={styles.refTitle}>ICMR reference limits (not measured from this plan)</Text>
              <Text style={styles.refItem}>
                • Added sugar below {ICMR.addedSugarMaxPctEnergy}% of energy
              </Text>
              <Text style={styles.refItem}>
                • Saturated fat below {ICMR.saturatedFatMaxPctEnergy}% of energy; trans-fat near zero
              </Text>
              <Text style={styles.refItem}>
                • Dietary fibre {ICMR.fiberGramsPer2000Kcal} g per 2000 kcal
              </Text>
              <Text style={styles.refItem}>• Salt below {ICMR.saltMaxGramsPerDay} g/day</Text>
              <Text style={styles.refItem}>
                • Protein RDA {ICMR.proteinRdaGramsPerKg} g/kg body weight/day (needs body weight for
                a per-client check)
              </Text>
            </View>

            <Text style={styles.citation}>
              Source: {ICMR_CITATION}. Macro ranges are general adult guidance; a clinically
              prescribed therapeutic plan may intentionally deviate.
            </Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
