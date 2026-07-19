/**
 * admin/components/StatusHistoryTimeline.jsx
 * Renders an incident's statusHistory (see adminMock.js) as a simple
 * vertical timeline — oldest entry first, so it reads top-to-bottom as
 * "how this incident got to its current status". Uses a flex row per
 * entry (dot+line column, content column) rather than absolute-position
 * tricks, so it doesn't depend on precisely matching a parent's padding.
 */
import { STATUS_LABEL, STATUS_DOT_COLOR } from "../constants/incidentStatus";
import { formatDateTime, timeAgo } from "../utils/formatDate";

export default function StatusHistoryTimeline({ history = [] }) {
  if (!history.length) {
    return (
      <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-6">
        No status history yet.
      </p>
    );
  }

  return (
    <ol>
      {history.map((entry, idx) => {
        const isLast = idx === history.length - 1;
        const color = STATUS_DOT_COLOR[entry.status] ?? "#94a3b8";
        return (
          <li key={`${entry.status}-${entry.at}-${idx}`} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className="w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-na-surface mt-1 shrink-0"
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
              {!isLast && (
                <span className="flex-1 w-px bg-gray-200 dark:bg-na-border my-1" aria-hidden="true" />
              )}
            </div>

            <div className={`min-w-0 flex-1 ${isLast ? "pb-0" : "pb-5"}`}>
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">
                  {STATUS_LABEL[entry.status] ?? entry.status}
                </p>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 whitespace-nowrap">
                  {formatDateTime(entry.at)}
                </p>
              </div>
              {entry.note && (
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{entry.note}</p>
              )}
              <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
                by {entry.by} · {timeAgo(entry.at)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
