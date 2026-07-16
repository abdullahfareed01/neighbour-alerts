/**
 * constants/incidentTypes.js
 *
 * SINGLE SOURCE OF TRUTH for incident type metadata.
 *
 * Previously "Theft", "Robbery", etc. (and their emojis, tag colors,
 * danger weights, and safety tips) were hardcoded separately in:
 *   - components/CreatePost/CreatePostModal.jsx
 *   - components/layout/Sidebar.jsx
 *   - pages/UserProfile.jsx
 *   - components/analytics/Analyticspanel.jsx
 *   - utils/dangerScore.js
 *
 * That duplication is how "Item Found" vs "Found Item" drifted apart in
 * data/incidents.js and silently broke styling/danger-tips for two seed
 * incidents. Everything now derives from INCIDENT_TYPE_DEFS below.
 *
 * To add a new incident type: add ONE entry here. Every consuming
 * component picks it up automatically.
 */

export const INCIDENT_TYPE_DEFS = [
  {
    type: "Theft",
    emoji: "💰",
    tagClass:
      "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700",
    hexColor: "#f59e0b",
    dangerWeight: 20,
    dangerTier: "moderate",
    tips: {
      high: "Theft active in this area. Secure your valuables and avoid displaying expensive items.",
      moderate:
        "Theft reported nearby. Keep wallets and phones secured and be watchful in crowded spots.",
      safe: "Theft occurred in this zone. Stay alert and report anyone acting suspiciously.",
    },
  },
  {
    type: "Robbery",
    emoji: "🔫",
    tagClass:
      "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700",
    hexColor: "#dc2626",
    dangerWeight: 40,
    dangerTier: "high",
    tips: {
      high: "Avoid this area now — active robbery reported nearby. Stay on main roads and keep valuables hidden.",
      moderate:
        "Robbery reported in this zone. Travel with others and stay aware of your surroundings.",
      safe: "Robbery occurred here recently. Remain cautious and report any suspicious activity.",
    },
  },
  {
    type: "Assault",
    emoji: "🚨",
    tagClass:
      "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700",
    hexColor: "#ea580c",
    dangerWeight: 38,
    dangerTier: "high",
    tips: {
      high: "Physical assault reported very close by. Avoid isolated paths and stay in well-lit areas.",
      moderate:
        "Assault incident nearby. Move through this area quickly and avoid confrontation.",
      safe: "Assault reported in this area. Stay alert and trust your instincts if something feels wrong.",
    },
  },
  {
    type: "Burglary",
    emoji: "🏠",
    tagClass:
      "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700",
    hexColor: "#a855f7",
    dangerWeight: 26,
    dangerTier: "moderate",
    tips: {
      high: "Burglary active nearby — ensure your doors and windows are locked. Alert neighbours.",
      moderate:
        "Break-in reported in this area. Check your home security and inform your building guard.",
      safe: "Burglary reported recently nearby. Consider a security check of your property.",
    },
  },
  {
    type: "Vandalism",
    emoji: "🔨",
    tagClass:
      "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700",
    hexColor: "#3b82f6",
    dangerWeight: 12,
    dangerTier: "safe",
    tips: {
      high: "Vandalism being reported nearby. Secure your vehicle and property and report damage.",
      moderate:
        "Vandalism in this area. Be aware of unsupervised groups and report damage promptly.",
      safe: "Vandalism reported here. Check your vehicle and property for any damage.",
    },
  },
  {
    type: "Lost Item",
    emoji: "📦",
    tagClass:
      "bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-700",
    hexColor: "#0ea5e9",
    dangerWeight: 4,
    dangerTier: "safe",
    tips: {
      high: "Multiple items lost nearby — double-check your belongings before leaving this area.",
      moderate:
        "Items reported lost in this zone. Keep track of your belongings carefully.",
      safe: "An item was lost near here. If you find it, report it to local security.",
    },
  },
  {
    type: "Item Found",
    emoji: "✅",
    tagClass:
      "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
    hexColor: "#10b981",
    dangerWeight: 0,
    dangerTier: "safe",
    tips: {
      high: "Found items reported nearby. Contact local security if you are missing something.",
      moderate:
        "An item was found in this area. Check with local authorities if you have lost something.",
      safe: "An item was found nearby. Reach out to the reporter if it belongs to you.",
    },
  },
  {
    type: "Snatching",
    emoji: "🏃",
    tagClass:
      "bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-300 dark:border-pink-700",
    hexColor: "#ec4899",
    dangerWeight: 32,
    dangerTier: "high",
    tips: {
      high: "Active snatching reported nearby — keep your phone and bag out of sight right now.",
      moderate:
        "Phone/bag snatching in this area. Keep valuables close and avoid using your phone while walking.",
      safe: "Snatching reported here recently. Be mindful of strangers approaching on motorbikes.",
    },
  },
  {
    type: "Harassment",
    emoji: "⚠️",
    tagClass:
      "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700",
    hexColor: "#f43f5e",
    dangerWeight: 28,
    dangerTier: "moderate",
    tips: {
      high: "Harassment reported very close. Avoid walking alone in this area and stay near public spaces.",
      moderate:
        "Harassment incident nearby. Walk with others and head towards a crowded, well-lit area.",
      safe: "Harassment reported in this zone. Report any suspicious persons to local security.",
    },
  },
];

// Fallback tips for any type not present in INCIDENT_TYPE_DEFS
export const DEFAULT_TIPS = {
  high: "Incident reported very close to you. Stay alert and consider avoiding this area.",
  moderate:
    "Incident in your vicinity. Take precautions and stay in safe, well-lit areas.",
  safe: "Incident reported nearby. Stay informed and remain aware of your surroundings.",
};

// ─── Derived lookups (consumed by components) ────────────────────────────────

// All valid incident type strings — useful for form <select>s / validation
export const INCIDENT_TYPE_VALUES = INCIDENT_TYPE_DEFS.map((d) => d.type);

// Shape expected by CreatePostModal's type-picker grid: { label, emoji, color }
export const INCIDENT_TYPES = INCIDENT_TYPE_DEFS.map((d) => ({
  label: d.type,
  emoji: d.emoji,
  color: d.tagClass,
}));

// type -> Tailwind badge classes (Sidebar, UserProfile)
export const TYPE_TAG_CLASS = INCIDENT_TYPE_DEFS.reduce((acc, d) => {
  acc[d.type] = d.tagClass;
  return acc;
}, {});

// type -> emoji (Sidebar, UserProfile, Analyticspanel)
export const TYPE_EMOJI = INCIDENT_TYPE_DEFS.reduce((acc, d) => {
  acc[d.type] = d.emoji;
  return acc;
}, {});

// type -> hex color (Analyticspanel bar chart)
export const TYPE_HEX_COLOR = INCIDENT_TYPE_DEFS.reduce((acc, d) => {
  acc[d.type] = d.hexColor;
  return acc;
}, {});

// type -> 0-40 danger weight (utils/dangerScore.js)
export const TYPE_WEIGHT = INCIDENT_TYPE_DEFS.reduce((acc, d) => {
  acc[d.type] = d.dangerWeight;
  return acc;
}, {});

// type -> { high, moderate, safe } safety tip strings (utils/dangerScore.js)
export const TYPE_TIPS = INCIDENT_TYPE_DEFS.reduce((acc, d) => {
  acc[d.type] = d.tips;
  return acc;
}, {});

// type -> "high" | "moderate" | "safe" bucket (Analyticspanel danger-level summary)
export const TYPE_DANGER_TIER = INCIDENT_TYPE_DEFS.reduce((acc, d) => {
  acc[d.type] = d.dangerTier;
  return acc;
}, {});
