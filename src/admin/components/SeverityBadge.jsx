/**
 * admin/components/SeverityBadge.jsx
 * Small pill showing an incident's severity tier. Mirrors StatusBadge.jsx
 * exactly (same shape, same sizing) so status + severity badges always
 * line up visually wherever they're shown together.
 */
import {
  SEVERITY_LABEL,
  SEVERITY_BADGE_CLASS,
  getSeverityTier,
} from "../constants/severity";

export default function SeverityBadge({ type }) {
  const tier = getSeverityTier(type);
  const cls =
    SEVERITY_BADGE_CLASS[tier] ??
    "bg-gray-100 dark:bg-na-hover text-gray-500 dark:text-slate-400 border-gray-200 dark:border-na-border";
  const label = SEVERITY_LABEL[tier] ?? "Unknown";

  return (
    <span
      className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${cls}`}
    >
      {label}
    </span>
  );
}
