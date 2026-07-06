/* eslint-disable jsx-a11y/alt-text -- @react-pdf/renderer's <Image> is not an HTML img and has no alt prop. */
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { DietReport } from "@/lib/schemas";
import { BRAND, APP_NAME } from "@/lib/theme";

/* -------------------------------------------------------------------------- */
/*  Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  page: {
    backgroundColor: BRAND.white,
    color: BRAND.ink,
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 54,
    paddingBottom: 56,
    paddingHorizontal: 44,
    lineHeight: 1.5,
  },
  // Cover
  cover: {
    backgroundColor: BRAND.black,
    color: BRAND.white,
    padding: 0,
    fontFamily: "Helvetica",
  },
  coverBar: {
    height: 10,
    backgroundColor: BRAND.yellow,
  },
  coverBody: {
    flexGrow: 1,
    paddingHorizontal: 54,
    paddingTop: 90,
    justifyContent: "space-between",
    paddingBottom: 64,
  },
  coverLogoWrap: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  coverLogo: { width: 158, height: 54, objectFit: "contain" },
  coverWordmark: {
    fontSize: 34,
    fontFamily: "Helvetica-Bold",
    color: BRAND.yellow,
    letterSpacing: 4,
  },
  coverKicker: {
    marginTop: 90,
    fontSize: 12,
    letterSpacing: 3,
    color: BRAND.yellow,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  coverTitle: {
    fontSize: 40,
    fontFamily: "Helvetica-Bold",
    color: BRAND.white,
    marginTop: 12,
    lineHeight: 1.1,
  },
  coverGoal: { fontSize: 15, color: "#D7D7D7", marginTop: 16, maxWidth: 380 },
  coverMetaRow: { flexDirection: "row", marginTop: 40, gap: 40 },
  coverMetaLabel: {
    fontSize: 8,
    letterSpacing: 2,
    color: BRAND.mute,
    textTransform: "uppercase",
  },
  coverMetaValue: {
    fontSize: 12,
    color: BRAND.white,
    marginTop: 4,
    fontFamily: "Helvetica-Bold",
  },
  coverFootline: { fontSize: 8, color: BRAND.mute, letterSpacing: 1 },

  // Header / footer (content pages)
  header: {
    position: "absolute",
    top: 22,
    left: 44,
    right: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: BRAND.line,
    paddingBottom: 8,
  },
  headerBrand: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 3,
    color: BRAND.black,
  },
  headerBrandDot: { color: BRAND.yellow },
  // Logo (yellow/white artwork) sits on a small black chip so it stays legible
  // on the white content-page header.
  headerLogoChip: {
    backgroundColor: BRAND.black,
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 7,
  },
  headerLogo: { width: 66, height: 21, objectFit: "contain" },
  headerClient: { fontSize: 8, color: BRAND.mute, letterSpacing: 1 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 44,
    right: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: BRAND.line,
    paddingTop: 8,
  },
  footerText: { fontSize: 7.5, color: BRAND.mute },

  // Sections
  section: { marginBottom: 20 },
  sectionHead: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  sectionAccent: {
    width: 4,
    height: 16,
    backgroundColor: BRAND.yellow,
    marginRight: 8,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: BRAND.black,
  },
  pageIntroTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: BRAND.black,
    lineHeight: 1.15,
    marginBottom: 4,
  },
  pageIntroSub: { fontSize: 9, color: BRAND.mute, lineHeight: 1.3, marginBottom: 18 },

  paragraph: { fontSize: 10, color: BRAND.slate, marginBottom: 6 },

  // Bullets
  bulletRow: { flexDirection: "row", marginBottom: 4, paddingRight: 6 },
  bulletDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: BRAND.yellow,
    marginTop: 5,
    marginRight: 7,
  },
  bulletText: { flex: 1, fontSize: 9.5, color: BRAND.slate },

  // Stat cards
  statRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 8,
    padding: 12,
    backgroundColor: BRAND.offwhite,
  },
  statCardAccent: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    backgroundColor: BRAND.black,
  },
  statLabel: {
    fontSize: 7.5,
    letterSpacing: 1.5,
    color: BRAND.mute,
    textTransform: "uppercase",
  },
  statLabelOnDark: {
    fontSize: 7.5,
    letterSpacing: 1.5,
    color: BRAND.yellow,
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: BRAND.black,
    lineHeight: 1.15,
    marginTop: 4,
  },
  statValueOnDark: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: BRAND.white,
    lineHeight: 1.15,
    marginTop: 4,
  },
  statUnit: { fontSize: 9, color: BRAND.mute, fontFamily: "Helvetica" },
  statSub: { fontSize: 8, color: BRAND.mute, marginTop: 2 },

  // Macro bars
  macroItem: { marginBottom: 9 },
  macroTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  macroName: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: BRAND.ink },
  macroVal: { fontSize: 9, color: BRAND.slate },
  macroTrack: {
    height: 8,
    backgroundColor: BRAND.line,
    borderRadius: 4,
    flexDirection: "row",
  },
  macroFill: { height: 8, borderRadius: 4 },

  // Tables
  table: { borderWidth: 1, borderColor: BRAND.line, borderRadius: 6, overflow: "hidden" },
  tHeadRow: { flexDirection: "row", backgroundColor: BRAND.black },
  tHeadCell: {
    color: BRAND.yellow,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
    paddingVertical: 6,
    paddingHorizontal: 8,
    textTransform: "uppercase",
  },
  tRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: BRAND.line },
  tRowAlt: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: BRAND.line,
    backgroundColor: BRAND.offwhite,
  },
  tCell: { fontSize: 8.5, color: BRAND.slate, paddingVertical: 6, paddingHorizontal: 8 },
  tCellStrong: {
    fontSize: 8.5,
    color: BRAND.ink,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },

  // Meals
  mealCard: {
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 8,
    marginBottom: 10,
    overflow: "hidden",
  },
  mealHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: BRAND.yellowTint,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  mealName: { fontSize: 11, fontFamily: "Helvetica-Bold", color: BRAND.black },
  mealMeta: { fontSize: 8, color: BRAND.slate },
  mealBody: { padding: 10 },

  // Pills
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 6 },
  pill: {
    backgroundColor: BRAND.yellowTint,
    color: BRAND.ink,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },

  // Two-column layout helper
  twoCol: { flexDirection: "row", gap: 16 },
  col: { flex: 1 },

  disclaimerBox: {
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: BRAND.yellow,
    backgroundColor: BRAND.offwhite,
    padding: 10,
    borderRadius: 4,
  },
  disclaimerText: { fontSize: 7.5, color: BRAND.mute, marginBottom: 3 },
});

/* -------------------------------------------------------------------------- */
/*  Helpers & small components                                                 */
/* -------------------------------------------------------------------------- */

const fmt = (n: number | null | undefined, suffix = "") =>
  n === null || n === undefined || Number.isNaN(n)
    ? "—"
    : `${Math.round(n).toLocaleString("en-US")}${suffix}`;

const clampPct = (n: number) => Math.max(0, Math.min(100, n));

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bulletDot} />
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

function SectionHead({ title }: { title: string }) {
  return (
    <View style={styles.sectionHead}>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function PageChrome({
  clientName,
  logoDataUri,
}: {
  clientName: string;
  logoDataUri?: string;
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
        <Text style={styles.headerClient}>DIET REPORT · {clientName.toUpperCase()}</Text>
      </View>
      <View style={styles.footer} fixed>
        <Text style={styles.footerText}>
          {APP_NAME} — Confidential nutrition report
        </Text>
        <Text
          style={styles.footerText}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        />
      </View>
    </>
  );
}

function MacroBar({
  name,
  grams,
  pct,
  color,
}: {
  name: string;
  grams: number;
  pct: number;
  color: string;
}) {
  return (
    <View style={styles.macroItem}>
      <View style={styles.macroTop}>
        <Text style={styles.macroName}>{name}</Text>
        <Text style={styles.macroVal}>
          {fmt(grams, " g")} · {fmt(pct, "%")}
        </Text>
      </View>
      <View style={styles.macroTrack}>
        <View
          style={[styles.macroFill, { width: `${clampPct(pct)}%`, backgroundColor: color }]}
        />
      </View>
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

export function ReportDocument({
  report,
  logoDataUri,
  generatedAt,
  reportId,
}: ReportDocumentProps) {
  const { client, overview, calories, macros } = report;

  return (
    <Document
      title={`LEANR Diet Report — ${client.name}`}
      author="LEANR"
      subject="AI-generated diet & nutrition report"
    >
      {/* ---------------------------------------------------------------- */}
      {/* COVER                                                            */}
      {/* ---------------------------------------------------------------- */}
      <Page size="A4" style={styles.cover}>
        <View style={styles.coverBar} />
        <View style={styles.coverBody}>
          <View>
            <View style={styles.coverLogoWrap}>
              {logoDataUri ? (
                <Image style={styles.coverLogo} src={logoDataUri} />
              ) : (
                <Text style={styles.coverWordmark}>{APP_NAME}</Text>
              )}
            </View>

            <Text style={styles.coverKicker}>Personalised Nutrition Report</Text>
            <Text style={styles.coverTitle}>
              Your Diet &{"\n"}Performance Plan
            </Text>
            {client.goal ? (
              <Text style={styles.coverGoal}>Goal · {client.goal}</Text>
            ) : null}

            <View style={styles.coverMetaRow}>
              <View>
                <Text style={styles.coverMetaLabel}>Prepared for</Text>
                <Text style={styles.coverMetaValue}>{client.name}</Text>
              </View>
              {client.plan_duration ? (
                <View>
                  <Text style={styles.coverMetaLabel}>Plan duration</Text>
                  <Text style={styles.coverMetaValue}>{client.plan_duration}</Text>
                </View>
              ) : null}
              <View>
                <Text style={styles.coverMetaLabel}>Date</Text>
                <Text style={styles.coverMetaValue}>{generatedAt}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.coverFootline}>
            Report ID {reportId.slice(0, 8).toUpperCase()} · Generated by {APP_NAME} AI ·
            Not a substitute for personalised medical advice
          </Text>
        </View>
      </Page>

      {/* ---------------------------------------------------------------- */}
      {/* OVERVIEW + NUTRITION                                             */}
      {/* ---------------------------------------------------------------- */}
      <Page size="A4" style={styles.page}>
        <PageChrome clientName={client.name} logoDataUri={logoDataUri} />

        <Text style={styles.pageIntroTitle}>Overview</Text>
        <Text style={styles.pageIntroSub}>
          {overview.dietary_pattern || "Personalised nutrition strategy"}
        </Text>

        <View style={styles.section}>
          <Text style={styles.paragraph}>{overview.summary}</Text>
          {overview.key_highlights.length > 0 ? (
            <View style={{ marginTop: 6 }}>
              {overview.key_highlights.map((h, i) => (
                <Bullet key={i}>{h}</Bullet>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <SectionHead title="Daily Energy Targets" />
          <View style={styles.statRow}>
            <View style={styles.statCardAccent}>
              <Text style={styles.statLabelOnDark}>Daily Target</Text>
              <Text style={styles.statValueOnDark}>
                {fmt(calories.daily_target_kcal)}{" "}
                <Text style={styles.statUnit}>kcal</Text>
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Maintenance</Text>
              <Text style={styles.statValue}>
                {fmt(calories.maintenance_kcal)}{" "}
                <Text style={styles.statUnit}>kcal</Text>
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>
                {calories.deficit_or_surplus_kcal !== null &&
                calories.deficit_or_surplus_kcal < 0
                  ? "Deficit"
                  : "Surplus"}
              </Text>
              <Text style={styles.statValue}>
                {calories.deficit_or_surplus_kcal === null
                  ? "—"
                  : fmt(Math.abs(calories.deficit_or_surplus_kcal))}{" "}
                <Text style={styles.statUnit}>kcal</Text>
              </Text>
            </View>
          </View>
          {calories.notes ? <Text style={styles.paragraph}>{calories.notes}</Text> : null}
        </View>

        <View style={styles.section}>
          <SectionHead title="Macronutrient Split" />
          <MacroBar name="Protein" grams={macros.protein_g} pct={macros.protein_pct} color={BRAND.black} />
          <MacroBar name="Carbohydrates" grams={macros.carbs_g} pct={macros.carbs_pct} color={BRAND.yellow} />
          <MacroBar name="Fats" grams={macros.fats_g} pct={macros.fats_pct} color={BRAND.slate} />
          {macros.fiber_g !== null ? (
            <Text style={[styles.statSub, { marginTop: 4 }]}>
              Fiber target: {fmt(macros.fiber_g, " g")} per day
            </Text>
          ) : null}
          {macros.notes ? (
            <Text style={[styles.paragraph, { marginTop: 6 }]}>{macros.notes}</Text>
          ) : null}
        </View>

        {report.micronutrients.length > 0 ? (
          <View style={styles.section}>
            <SectionHead title="Micronutrients to Monitor" />
            <View style={styles.table}>
              <View style={styles.tHeadRow}>
                <Text style={[styles.tHeadCell, { flex: 2 }]}>Nutrient</Text>
                <Text style={[styles.tHeadCell, { flex: 1.4 }]}>Target</Text>
                <Text style={[styles.tHeadCell, { flex: 1.4 }]}>Status</Text>
                <Text style={[styles.tHeadCell, { flex: 3 }]}>Note</Text>
              </View>
              {report.micronutrients.map((m, i) => (
                <View key={i} style={i % 2 ? styles.tRowAlt : styles.tRow}>
                  <Text style={[styles.tCellStrong, { flex: 2 }]}>{m.name}</Text>
                  <Text style={[styles.tCell, { flex: 1.4 }]}>{m.amount || "—"}</Text>
                  <Text style={[styles.tCell, { flex: 1.4 }]}>
                    {m.status ? m.status.charAt(0).toUpperCase() + m.status.slice(1) : "—"}
                  </Text>
                  <Text style={[styles.tCell, { flex: 3 }]}>{m.note || "—"}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </Page>

      {/* ---------------------------------------------------------------- */}
      {/* MEAL PLAN                                                        */}
      {/* ---------------------------------------------------------------- */}
      {report.meals.length > 0 ? (
        <Page size="A4" style={styles.page}>
          <PageChrome clientName={client.name} logoDataUri={logoDataUri} />
          <Text style={styles.pageIntroTitle}>Meal Plan</Text>
          <Text style={styles.pageIntroSub}>
            Structured breakdown of your daily meals
          </Text>

          {report.meals.map((meal, i) => (
            <View key={i} style={styles.mealCard} wrap={false}>
              <View style={styles.mealHead}>
                <Text style={styles.mealName}>{meal.name}</Text>
                <Text style={styles.mealMeta}>
                  {[meal.time, meal.approx_kcal !== null ? `${fmt(meal.approx_kcal)} kcal` : null]
                    .filter(Boolean)
                    .join("  ·  ")}
                </Text>
              </View>
              <View style={styles.mealBody}>
                {meal.items.length > 0 ? (
                  meal.items.map((it, j) => <Bullet key={j}>{it}</Bullet>)
                ) : (
                  <Text style={styles.paragraph}>No items listed.</Text>
                )}
              </View>
            </View>
          ))}
        </Page>
      ) : null}

      {/* ---------------------------------------------------------------- */}
      {/* TRAINING, HYDRATION, RECOVERY, SUPPLEMENTS                       */}
      {/* ---------------------------------------------------------------- */}
      <Page size="A4" style={styles.page}>
        <PageChrome clientName={client.name} logoDataUri={logoDataUri} />
        <Text style={styles.pageIntroTitle}>Training & Recovery</Text>
        <Text style={styles.pageIntroSub}>
          {report.workout.focus || "Movement, hydration and recovery guidance"}
        </Text>

        {report.workout.weekly_split.length > 0 ? (
          <View style={styles.section}>
            <SectionHead title="Weekly Training Split" />
            <View style={styles.table}>
              <View style={styles.tHeadRow}>
                <Text style={[styles.tHeadCell, { flex: 1.2 }]}>Day</Text>
                <Text style={[styles.tHeadCell, { flex: 1.6 }]}>Focus</Text>
                <Text style={[styles.tHeadCell, { flex: 3.5 }]}>Details</Text>
              </View>
              {report.workout.weekly_split.map((d, i) => (
                <View key={i} style={i % 2 ? styles.tRowAlt : styles.tRow} wrap={false}>
                  <Text style={[styles.tCellStrong, { flex: 1.2 }]}>{d.day}</Text>
                  <Text style={[styles.tCell, { flex: 1.6 }]}>{d.focus}</Text>
                  <Text style={[styles.tCell, { flex: 3.5 }]}>{d.details}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {report.workout.recommendations.length > 0 ? (
          <View style={styles.section}>
            <SectionHead title="Training Recommendations" />
            {report.workout.recommendations.map((r, i) => (
              <Bullet key={i}>{r}</Bullet>
            ))}
          </View>
        ) : null}

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <SectionHead title="Hydration" />
            {report.hydration.daily_water_liters !== null ? (
              <View style={[styles.statCard, { flexGrow: 0, flexBasis: "auto", marginBottom: 8 }]}>
                <Text style={styles.statLabel}>Daily Water</Text>
                <Text style={styles.statValue}>
                  {report.hydration.daily_water_liters}{" "}
                  <Text style={styles.statUnit}>litres</Text>
                </Text>
              </View>
            ) : null}
            {report.hydration.recommendations.map((r, i) => (
              <Bullet key={i}>{r}</Bullet>
            ))}
          </View>
          <View style={styles.col}>
            <SectionHead title="Recovery" />
            {report.recovery.sleep_hours ? (
              <View style={[styles.statCard, { flexGrow: 0, flexBasis: "auto", marginBottom: 8 }]}>
                <Text style={styles.statLabel}>Sleep Target</Text>
                <Text style={[styles.statValue, { fontSize: 16 }]}>
                  {report.recovery.sleep_hours}
                </Text>
              </View>
            ) : null}
            {report.recovery.recommendations.map((r, i) => (
              <Bullet key={i}>{r}</Bullet>
            ))}
          </View>
        </View>

        {report.supplements.length > 0 ? (
          <View style={[styles.section, { marginTop: 20 }]}>
            <SectionHead title="Supplement Suggestions" />
            <View style={styles.table}>
              <View style={styles.tHeadRow}>
                <Text style={[styles.tHeadCell, { flex: 1.6 }]}>Supplement</Text>
                <Text style={[styles.tHeadCell, { flex: 1.3 }]}>Dosage</Text>
                <Text style={[styles.tHeadCell, { flex: 1.6 }]}>Timing</Text>
                <Text style={[styles.tHeadCell, { flex: 2.5 }]}>Purpose</Text>
              </View>
              {report.supplements.map((s, i) => (
                <View key={i} style={i % 2 ? styles.tRowAlt : styles.tRow} wrap={false}>
                  <Text style={[styles.tCellStrong, { flex: 1.6 }]}>{s.name}</Text>
                  <Text style={[styles.tCell, { flex: 1.3 }]}>{s.dosage || "—"}</Text>
                  <Text style={[styles.tCell, { flex: 1.6 }]}>{s.timing || "—"}</Text>
                  <Text style={[styles.tCell, { flex: 2.5 }]}>{s.purpose || "—"}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {report.disclaimers.length > 0 ? (
          <View style={styles.disclaimerBox} wrap={false}>
            {report.disclaimers.map((d, i) => (
              <Text key={i} style={styles.disclaimerText}>
                • {d}
              </Text>
            ))}
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
