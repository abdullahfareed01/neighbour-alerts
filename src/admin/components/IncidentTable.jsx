/**
 * admin/components/IncidentTable.jsx
 *
 * Responsive incident list for /admin/incidents:
 *   - Real <table> on md+ screens.
 *   - Stacked cards below md (same responsive pattern already used by
 *     components/layout/Sidebar.jsx and pages/UserProfile.jsx).
 *
 * Deliberately presentational: it does not know HOW to change an
 * incident's status or delete it. Row-level quick actions are supplied
 * by the parent via `renderRowActions(incident)` (a render-prop), so this
 * file has zero import dependency on IncidentActions.jsx. "View details"
 * is the one action baked in directly, since navigating to the detail
 * page is table-inherent behavior, not a status action.
 *
 * Reuses the existing EmptyState component (Phase 2) instead of a new
 * empty-state pattern, and the same category-badge styling
 * (TYPE_TAG_CLASS/TYPE_EMOJI) already used by Sidebar/UserProfile so
 * category chips look identical between the user app and admin.
 */
import { Eye, MapPin } from "lucide-react";
import EmptyState from "./EmptyState";
import StatusBadge from "./StatusBadge";
import SeverityBadge from "./SeverityBadge";
import { TYPE_TAG_CLASS, TYPE_EMOJI } from "../../constants/incidentTypes";
import { formatDateTime } from "../utils/formatDate";

function CategoryChip({ type }) {
  const cls =
    TYPE_TAG_CLASS[type] ??
    "bg-gray-50 dark:bg-na-hover text-gray-600 dark:text-slate-400 border-gray-200 dark:border-na-border";
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${cls}`}
    >
      {TYPE_EMOJI[type] ?? "📍"} {type}
    </span>
  );
}

function LocationCell({ incident }) {
  const label = incident.locationLabel;
  const coords =
    typeof incident.lat === "number" && typeof incident.lng === "number"
      ? `${incident.lat.toFixed(3)}, ${incident.lng.toFixed(3)}`
      : null;

  if (!label && !coords) {
    return <span className="text-gray-300 dark:text-slate-600">—</span>;
  }

  return (
    <div className="min-w-0">
      {label && (
        <p className="text-xs font-medium text-gray-700 dark:text-slate-200 truncate">
          {label}
        </p>
      )}
      {coords && (
        <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate">
          {coords}
        </p>
      )}
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100 dark:border-na-border">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="py-3.5 px-3">
          <div className="h-3 bg-gray-100 dark:bg-na-hover rounded animate-pulse w-full max-w-[110px]" />
        </td>
      ))}
    </tr>
  );
}

function SkeletonCard() {
  return (
    <li className="bg-white dark:bg-na-card border border-gray-100 dark:border-na-border rounded-xl p-3.5 animate-pulse">
      <div className="h-3 bg-gray-200 dark:bg-na-hover rounded w-1/3 mb-2" />
      <div className="h-3.5 bg-gray-200 dark:bg-na-hover rounded w-3/4 mb-1.5" />
      <div className="h-2.5 bg-gray-100 dark:bg-na-border rounded w-full mb-2" />
      <div className="flex gap-1.5">
        <div className="h-4 bg-gray-100 dark:bg-na-border rounded-full w-16" />
        <div className="h-4 bg-gray-100 dark:bg-na-border rounded-full w-16" />
      </div>
    </li>
  );
}

const COLUMNS = [
  "Incident",
  "Category",
  "Severity",
  "Reported",
  "Location",
  "Status",
  "Actions",
];

export default function IncidentTable({
  incidents = [],
  loading = false,
  onView,
  renderRowActions,
  emptyTitle = "No incidents found",
  emptyDescription = "Try adjusting your search or filters.",
}) {
  const showEmpty = !loading && incidents.length === 0;

  return (
    <div className="bg-white dark:bg-na-surface rounded-2xl border border-gray-100 dark:border-na-border shadow-sm overflow-hidden">
      {/* ── Desktop table ─────────────────────────────────────────────── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 dark:border-na-border bg-gray-50/60 dark:bg-na-hover/40">
              {COLUMNS.map((col) => (
                <th
                  key={col}
                  className="py-2.5 px-3 text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500 whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}

            {!loading &&
              incidents.map((inc) => (
                <tr
                  key={inc.id}
                  onClick={() => onView?.(inc.id)}
                  className="border-b border-gray-50 dark:border-na-border/60 last:border-b-0 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-3 max-w-[260px]">
                    <p className="text-[10px] font-mono text-gray-400 dark:text-slate-500 mb-0.5">
                      {inc.id}
                    </p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 truncate">
                      {inc.title}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate">
                      {inc.description}
                    </p>
                  </td>
                  <td className="py-3 px-3">
                    <CategoryChip type={inc.type} />
                  </td>
                  <td className="py-3 px-3">
                    <SeverityBadge type={inc.type} />
                  </td>
                  <td className="py-3 px-3">
                    <p className="text-xs text-gray-600 dark:text-slate-300 whitespace-nowrap">
                      {formatDateTime(inc.createdAt)}
                    </p>
                  </td>
                  <td className="py-3 px-3 max-w-[160px]">
                    <LocationCell incident={inc} />
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={inc.status} />
                  </td>
                  <td
                    className="py-3 px-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onView?.(inc.id)}
                        title="View details"
                        className="p-1.5 rounded-lg text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/25 active:scale-90 transition-all"
                      >
                        <Eye size={15} />
                      </button>
                      {renderRowActions?.(inc)}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {showEmpty && (
          <EmptyState
            icon={MapPin}
            title={emptyTitle}
            description={emptyDescription}
          />
        )}
      </div>

      {/* ── Mobile cards ──────────────────────────────────────────────── */}
      <ul className="md:hidden p-3 space-y-2.5">
        {loading &&
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}

        {!loading &&
          incidents.map((inc) => (
            <li
              key={inc.id}
              onClick={() => onView?.(inc.id)}
              className="bg-white dark:bg-na-card border border-gray-100 dark:border-na-border rounded-xl p-3.5 cursor-pointer active:scale-[.99] transition-transform"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="text-[10px] font-mono text-gray-400 dark:text-slate-500">
                  {inc.id}
                </p>
                <StatusBadge status={inc.status} />
              </div>

              <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-100 leading-snug mb-1">
                {inc.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 mb-2.5">
                {inc.description}
              </p>

              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                <CategoryChip type={inc.type} />
                <SeverityBadge type={inc.type} />
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-slate-500 mb-2.5">
                <span>{formatDateTime(inc.createdAt)}</span>
                {(inc.locationLabel || typeof inc.lat === "number") && (
                  <span className="flex items-center gap-1 truncate max-w-[55%]">
                    <MapPin size={10} className="shrink-0" />
                    {inc.locationLabel ??
                      `${inc.lat.toFixed(3)}, ${inc.lng.toFixed(3)}`}
                  </span>
                )}
              </div>

              <div
                className="flex items-center gap-1.5 pt-2.5 border-t border-gray-100 dark:border-na-border"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => onView?.(inc.id)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/25 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <Eye size={13} />
                  View
                </button>
                {renderRowActions?.(inc)}
              </div>
            </li>
          ))}

        {showEmpty && (
          <li>
            <EmptyState
              icon={MapPin}
              title={emptyTitle}
              description={emptyDescription}
            />
          </li>
        )}
      </ul>
    </div>
  );
}
