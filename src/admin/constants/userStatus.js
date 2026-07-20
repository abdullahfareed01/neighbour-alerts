/**
 * admin/constants/userStatus.js
 *
 * SINGLE SOURCE OF TRUTH for admin user account-status display metadata —
 * mirrors the exact pattern already established by
 * admin/constants/incidentStatus.js (one defs array, derived lookup maps
 * for label/badge classes/dot color), so status styling never drifts
 * between UserStatusBadge, the users table, filters, and the user detail
 * page.
 *
 * Phase 5 (CLAUDE.md §6, User Management) only calls for two states —
 * active and suspended — reachable through the mock "Suspend" / "Restore"
 * actions. Exported names are prefixed with USER_ (rather than reusing
 * STATUS_*) so this can be imported alongside incidentStatus.js's exports
 * in the same file (e.g. a future combined admin search) without a
 * naming collision.
 */

export const USER_STATUS_DEFS = [
  {
    status: "active",
    label: "Active",
    badgeClass:
      "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
    dotColor: "#10b981",
  },
  {
    status: "suspended",
    label: "Suspended",
    badgeClass:
      "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700",
    dotColor: "#dc2626",
  },
];

export const USER_STATUS_VALUES = USER_STATUS_DEFS.map((d) => d.status);

export const USER_STATUS_LABEL = USER_STATUS_DEFS.reduce((acc, d) => {
  acc[d.status] = d.label;
  return acc;
}, {});

export const USER_STATUS_BADGE_CLASS = USER_STATUS_DEFS.reduce((acc, d) => {
  acc[d.status] = d.badgeClass;
  return acc;
}, {});

export const USER_STATUS_DOT_COLOR = USER_STATUS_DEFS.reduce((acc, d) => {
  acc[d.status] = d.dotColor;
  return acc;
}, {});
