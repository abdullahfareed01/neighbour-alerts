/**
 * admin/constants/severity.js
 *
 * SINGLE SOURCE OF TRUTH for admin "severity" display metadata — mirrors
 * the admin/constants/incidentStatus.js pattern (defs array + derived
 * lookup maps) so severity styling never drifts between the incident
 * table, filters, and detail page.
 *
 * IMPORTANT: this file does NOT invent a new danger classification. Each
 * incident's severity tier comes from constants/incidentTypes.js's
 * TYPE_DANGER_TIER map — the same "high" | "moderate" | "safe" bucketing
 * Analyticspanel.jsx already uses for its danger-level summary. This file
 * only adds admin-facing labels/colors for those three tiers, and a
 * helper to look a tier up by incident type.
 *
 * Note: the user-facing utils/dangerScore.js computes a *per-incident*
 * score that also factors in the viewer's distance and the incident's
 * recency — that's a "how dangerous is this to me, right now" concept
 * that only makes sense relative to a specific viewer's location. Admin
 * incident severity has no such viewer, so it intentionally uses the
 * type's inherent tier instead of trying to synthesize a fake distance.
 */
import { TYPE_DANGER_TIER } from "../../constants/incidentTypes";

export const SEVERITY_DEFS = [
  {
    tier: "high",
    label: "High",
    badgeClass:
      "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700",
    dotColor: "#dc2626",
  },
  {
    tier: "moderate",
    label: "Moderate",
    badgeClass:
      "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700",
    dotColor: "#f59e0b",
  },
  {
    tier: "safe",
    label: "Low",
    badgeClass:
      "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
    dotColor: "#10b981",
  },
];

export const SEVERITY_VALUES = SEVERITY_DEFS.map((d) => d.tier);

export const SEVERITY_LABEL = SEVERITY_DEFS.reduce((acc, d) => {
  acc[d.tier] = d.label;
  return acc;
}, {});

export const SEVERITY_BADGE_CLASS = SEVERITY_DEFS.reduce((acc, d) => {
  acc[d.tier] = d.badgeClass;
  return acc;
}, {});

export const SEVERITY_DOT_COLOR = SEVERITY_DEFS.reduce((acc, d) => {
  acc[d.tier] = d.dotColor;
  return acc;
}, {});

/** incident type -> "high" | "moderate" | "safe", defaulting to "moderate"
 *  for any type not present in TYPE_DANGER_TIER. */
export function getSeverityTier(incidentType) {
  return TYPE_DANGER_TIER[incidentType] ?? "moderate";
}
