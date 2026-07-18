/**
 * admin/constants/incidentStatus.js
 *
 * SINGLE SOURCE OF TRUTH for admin incident status metadata — mirrors the
 * pattern already established by constants/incidentTypes.js (one array of
 * defs, derived lookup maps for label/badge classes/dot color), so status
 * styling never drifts between StatusBadge, the dashboard's status
 * summary, and (in a later phase) the incident management table.
 *
 * Supported statuses match CLAUDE.md §6: Pending, Under Review, Verified,
 * Resolved, Rejected.
 */

export const INCIDENT_STATUS_DEFS = [
  {
    status: "pending",
    label: "Pending",
    badgeClass:
      "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700",
    dotColor: "#f59e0b",
  },
  {
    status: "under_review",
    label: "Under Review",
    badgeClass:
      "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700",
    dotColor: "#3b82f6",
  },
  {
    status: "verified",
    label: "Verified",
    badgeClass:
      "bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-700",
    dotColor: "#8b5cf6",
  },
  {
    status: "resolved",
    label: "Resolved",
    badgeClass:
      "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
    dotColor: "#10b981",
  },
  {
    status: "rejected",
    label: "Rejected",
    badgeClass:
      "bg-gray-100 dark:bg-na-hover text-gray-500 dark:text-slate-400 border-gray-300 dark:border-na-border",
    dotColor: "#94a3b8",
  },
];

export const STATUS_VALUES = INCIDENT_STATUS_DEFS.map((d) => d.status);

export const STATUS_LABEL = INCIDENT_STATUS_DEFS.reduce((acc, d) => {
  acc[d.status] = d.label;
  return acc;
}, {});

export const STATUS_BADGE_CLASS = INCIDENT_STATUS_DEFS.reduce((acc, d) => {
  acc[d.status] = d.badgeClass;
  return acc;
}, {});

export const STATUS_DOT_COLOR = INCIDENT_STATUS_DEFS.reduce((acc, d) => {
  acc[d.status] = d.dotColor;
  return acc;
}, {});
