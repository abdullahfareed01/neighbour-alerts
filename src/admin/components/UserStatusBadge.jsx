/**
 * admin/components/UserStatusBadge.jsx
 * Small pill showing a user's account status. Colors/labels come from
 * admin/constants/userStatus.js — the single source of truth — mirroring
 * StatusBadge.jsx exactly (same shape/sizing) so account-status badges
 * line up visually with the incident-status badges used elsewhere.
 */
import {
  USER_STATUS_LABEL,
  USER_STATUS_BADGE_CLASS,
} from "../constants/userStatus";

export default function UserStatusBadge({ status }) {
  const cls =
    USER_STATUS_BADGE_CLASS[status] ??
    "bg-gray-100 dark:bg-na-hover text-gray-500 dark:text-slate-400 border-gray-200 dark:border-na-border";
  const label = USER_STATUS_LABEL[status] ?? status ?? "Unknown";

  return (
    <span
      className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${cls}`}
    >
      {label}
    </span>
  );
}
