/**
 * LEANR brand tokens shared between the web UI and the generated PDF.
 * (react-pdf cannot read Tailwind/CSS variables, so colours live here as
 * plain values and are imported by both layers.)
 */
export const BRAND = {
  yellow: "#FFD400",
  yellowSoft: "#FFE566",
  yellowTint: "#FFF7CC",
  black: "#0A0A0A",
  ink: "#141414",
  slate: "#4B4B4B",
  mute: "#8A8A8A",
  line: "#E6E6E6",
  paper: "#FFFFFF",
  offwhite: "#FAFAF7",
  white: "#FFFFFF",
} as const;

export const APP_NAME = "LEANR";
export const APP_TAGLINE = "AI Diet Report Generator";
