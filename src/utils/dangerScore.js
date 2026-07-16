/**
 * utils/dangerScore.js
 *
 * Pure, deterministic logic — no API calls.
 * Computes a risk score 0–100 per incident and derives:
 *   - level:      "safe" | "moderate" | "high"
 *   - label:      "🟢 Safe" | "🟠 Moderate" | "🔴 High Risk"
 *   - suggestion: 1–2 line safety tip tailored to incident type + context
 *
 * Score formula:
 *   typeWeight   (0–40 pts)  violent crimes score highest
 *   distWeight   (0–30 pts)  closer = higher
 *   recencyWeight(0–30 pts)  last 1h = full points, fades over 24h
 *
 * Type weights + safety tips live in constants/incidentTypes.js (single
 * source of truth shared with CreatePostModal, Sidebar, UserProfile, and
 * Analyticspanel) rather than being duplicated here.
 */
import { TYPE_WEIGHT, TYPE_TIPS, DEFAULT_TIPS } from "../constants/incidentTypes";

// ─── Main export ──────────────────────────────────────────────────────────────
export function getDangerScore(incident) {
  const { type, distance = 5, createdAt } = incident;

  // 1. Type weight (0–40)
  const tw = TYPE_WEIGHT[type] ?? 10;

  // 2. Distance weight (0–30): 0 km → 30pts, 5+ km → 0pts
  const clampedDist = Math.min(Math.max(distance, 0), 5);
  const dw = Math.round((1 - clampedDist / 5) * 30);

  // 3. Recency weight (0–30): within 1hr → 30pts, fades linearly over 24hr → 0pts
  const ageMs  = Date.now() - new Date(createdAt ?? 0).getTime();
  const ageHrs = ageMs / (1000 * 60 * 60);
  const rw     = Math.round(Math.max(0, 1 - ageHrs / 24) * 30);

  const score = tw + dw + rw; // 0–100

  let level;
  if (score >= 55)      level = "high";
  else if (score >= 28) level = "moderate";
  else                  level = "safe";

  const labels = { high: "🔴 High Risk", moderate: "🟠 Moderate", safe: "🟢 Safe" };
  const colors = {
    high:     "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/25 border-red-200 dark:border-red-800",
    moderate: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/25 border-amber-200 dark:border-amber-800",
    safe:     "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/25 border-emerald-200 dark:border-emerald-800",
  };

  const tipMap = TYPE_TIPS[type] ?? DEFAULT_TIPS;
  const suggestion = typeof tipMap === "object" && tipMap[level]
    ? tipMap[level]
    : DEFAULT_TIPS[level];

  return { score, level, label: labels[level], color: colors[level], suggestion };
}