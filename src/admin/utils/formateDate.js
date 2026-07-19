/**
 * admin/utils/formatDate.js
 * Small date-formatting helpers shared by IncidentTable, StatusHistoryTimeline,
 * and AdminIncidentDetail — kept here once instead of re-implementing in each
 * new component. Mirrors the existing single-purpose files already in
 * utils/ (haversine.js, dangerScore.js).
 */

/** "Jan 5, 2026, 3:45 PM" style absolute timestamp — used wherever a
 *  scannable, unambiguous date/time is needed (table rows, detail page). */
export function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "3h ago" style relative timestamp. */
export function timeAgo(iso) {
  if (!iso) return "";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
