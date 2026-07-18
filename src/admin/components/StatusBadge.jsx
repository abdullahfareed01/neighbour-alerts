/**
 * admin/components/StatusBadge.jsx
 * Small pill showing an incident's admin status. Colors/labels come from
 * admin/constants/incidentStatus.js — the single source of truth — so
 * every place status is shown (dashboard, later the incident table/detail
 * page) stays visually consistent automatically.
 */
import { STATUS_LABEL, STATUS_BADGE_CLASS } from "../constants/incidentStatus";

export default function StatusBadge({ status }) {
  const cls =
    STATUS_BADGE_CLASS[status] ??
    "bg-gray-100 dark:bg-na-hover text-gray-500 dark:text-slate-400 border-gray-200 dark:border-na-border";
  const label = STATUS_LABEL[status] ?? status ?? "Unknown";

  return (
    <span
      className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${cls}`}
    >
      {label}
    </span>
  );
}
