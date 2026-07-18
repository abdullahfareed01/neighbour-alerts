/**
 * admin/components/RecentIncidents.jsx
 *
 * Simple, read-only "recent incidents" preview list for the admin Overview
 * Dashboard. This is NOT the full incident-management table (filters,
 * sorting, bulk actions, status changes) — that's a later phase per
 * CLAUDE.md §6. This component only renders whatever incident list it's
 * given via props; it never fetches or imports mock data itself.
 *
 * Visual language borrows from the existing incident-card patterns in
 * components/layout/Sidebar.jsx / pages/UserProfile.jsx (emoji chip +
 * title + meta row) so the admin section still feels like the same app.
 */
import { Clock, Eye, MapPin } from "lucide-react";
import StatusBadge from "./StatusBadge";
import EmptyState from "./EmptyState";
import { TYPE_EMOJI } from "../../constants/incidentTypes";

function timeAgo(d) {
  if (!d) return "";
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function RecentIncidents({ incidents = [], title = "Recent Incidents" }) {
  return (
    <div className="bg-white dark:bg-na-surface rounded-2xl p-4 border border-gray-100 dark:border-na-border shadow-sm">
      <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 mb-1 flex items-center gap-2">
        <Clock size={16} className="text-blue-600 dark:text-blue-400" />
        {title}
      </h3>

      {incidents.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No incidents yet"
          description="Newly reported incidents will show up here as soon as they come in."
        />
      ) : (
        <ul className="mt-2 divide-y divide-gray-100 dark:divide-na-border">
          {incidents.map((inc) => (
            <li
              key={inc.id}
              className="py-3 first:pt-2 last:pb-0 flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-na-hover flex items-center justify-center text-base shrink-0">
                {TYPE_EMOJI[inc.type] ?? "📍"}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 truncate">
                  {inc.title}
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500 truncate">
                  {inc.reporterName ?? "Anonymous"} • {timeAgo(inc.createdAt)}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-gray-400 dark:text-slate-500">
                  <Eye size={11} /> {inc.views ?? 0}
                </span>
                <StatusBadge status={inc.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
