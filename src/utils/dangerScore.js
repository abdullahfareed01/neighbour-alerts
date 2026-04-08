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
 */

// ─── Type weights ─────────────────────────────────────────────────────────────
const TYPE_WEIGHT = {
  Robbery:      40,
  Assault:      38,
  Snatching:    32,
  Harassment:   28,
  Burglary:     26,
  Theft:        20,
  Vandalism:    12,
  "Lost Item":   4,
  "Item Found":  0,
};

// ─── Safety suggestions per type + risk level ─────────────────────────────────
const TIPS = {
  Robbery: {
    high:     "Avoid this area now — active robbery reported nearby. Stay on main roads and keep valuables hidden.",
    moderate: "Robbery reported in this zone. Travel with others and stay aware of your surroundings.",
    safe:     "Robbery occurred here recently. Remain cautious and report any suspicious activity.",
  },
  Assault: {
    high:     "Physical assault reported very close by. Avoid isolated paths and stay in well-lit areas.",
    moderate: "Assault incident nearby. Move through this area quickly and avoid confrontation.",
    safe:     "Assault reported in this area. Stay alert and trust your instincts if something feels wrong.",
  },
  Snatching: {
    high:     "Active snatching reported nearby — keep your phone and bag out of sight right now.",
    moderate: "Phone/bag snatching in this area. Keep valuables close and avoid using your phone while walking.",
    safe:     "Snatching reported here recently. Be mindful of strangers approaching on motorbikes.",
  },
  Harassment: {
    high:     "Harassment reported very close. Avoid walking alone in this area and stay near public spaces.",
    moderate: "Harassment incident nearby. Walk with others and head towards a crowded, well-lit area.",
    safe:     "Harassment reported in this zone. Report any suspicious persons to local security.",
  },
  Burglary: {
    high:     "Burglary active nearby — ensure your doors and windows are locked. Alert neighbours.",
    moderate: "Break-in reported in this area. Check your home security and inform your building guard.",
    safe:     "Burglary reported recently nearby. Consider a security check of your property.",
  },
  Theft: {
    high:     "Theft active in this area. Secure your valuables and avoid displaying expensive items.",
    moderate: "Theft reported nearby. Keep wallets and phones secured and be watchful in crowded spots.",
    safe:     "Theft occurred in this zone. Stay alert and report anyone acting suspiciously.",
  },
  Vandalism: {
    high:     "Vandalism being reported nearby. Secure your vehicle and property and report damage.",
    moderate: "Vandalism in this area. Be aware of unsupervised groups and report damage promptly.",
    safe:     "Vandalism reported here. Check your vehicle and property for any damage.",
  },
  "Lost Item": {
    high:     "Multiple items lost nearby — double-check your belongings before leaving this area.",
    moderate: "Items reported lost in this zone. Keep track of your belongings carefully.",
    safe:     "An item was lost near here. If you find it, report it to local security.",
  },
  "Item Found": {
    high:     "Found items reported nearby. Contact local security if you are missing something.",
    moderate: "An item was found in this area. Check with local authorities if you have lost something.",
    safe:     "An item was found nearby. Reach out to the reporter if it belongs to you.",
  },
};

const DEFAULT_TIPS = {
  high:     "Incident reported very close to you. Stay alert and consider avoiding this area.",
  moderate: "Incident in your vicinity. Take precautions and stay in safe, well-lit areas.",
  safe:     "Incident reported nearby. Stay informed and remain aware of your surroundings.",
};

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

  const tipMap = TIPS[type] ?? DEFAULT_TIPS;
  const suggestion = typeof tipMap === "object" && tipMap[level]
    ? tipMap[level]
    : DEFAULT_TIPS[level];

  return { score, level, label: labels[level], color: colors[level], suggestion };
}