/**
 * admin/components/UserTable.jsx
 *
 * Responsive user list for /admin/users:
 *   - Real <table> on md+ screens.
 *   - Stacked cards below md.
 *
 * Mirrors admin/components/IncidentTable.jsx's structure exactly (same
 * skeleton rows, same EmptyState reuse, same render-prop for row
 * actions so this file has zero import dependency on UserActions.jsx —
 * "View details" is the one action baked in directly since navigating to
 * the detail page is table-inherent behavior, not an account action).
 */
import { Eye, Users as UsersIcon } from "lucide-react";
import EmptyState from "./EmptyState";
import UserStatusBadge from "./UserStatusBadge";
import { formatDateTime, timeAgo } from "../utils/formatDate";

function Avatar({ name }) {
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
      {(name ?? "?").charAt(0).toUpperCase()}
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100 dark:border-na-border">
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="py-3.5 px-3">
          <div className="h-3 bg-gray-100 dark:bg-na-hover rounded animate-pulse w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

function SkeletonCard() {
  return (
    <li className="bg-white dark:bg-na-card border border-gray-100 dark:border-na-border rounded-xl p-3.5 animate-pulse">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-na-hover shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-gray-200 dark:bg-na-hover rounded w-1/2" />
          <div className="h-2.5 bg-gray-100 dark:bg-na-border rounded w-2/3" />
        </div>
      </div>
      <div className="flex gap-1.5">
        <div className="h-4 bg-gray-100 dark:bg-na-border rounded-full w-16" />
        <div className="h-4 bg-gray-100 dark:bg-na-border rounded-full w-16" />
      </div>
    </li>
  );
}

const COLUMNS = ["User", "Joined", "Reports", "Status", "Actions"];

export default function UserTable({
  users = [],
  loading = false,
  onView,
  renderRowActions,
  emptyTitle = "No users found",
  emptyDescription = "Try adjusting your search or filters.",
}) {
  const showEmpty = !loading && users.length === 0;

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
              users.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => onView?.(u.id)}
                  className="border-b border-gray-50 dark:border-na-border/60 last:border-b-0 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-3 max-w-[240px]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={u.name} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 truncate">
                          {u.name}
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate">
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <p className="text-xs text-gray-600 dark:text-slate-300 whitespace-nowrap">
                      {formatDateTime(u.joinedAt)}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500">
                      {timeAgo(u.joinedAt)}
                    </p>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-xs font-semibold text-gray-700 dark:text-slate-200">
                      {u.reportsCount ?? 0}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <UserStatusBadge status={u.status} />
                  </td>
                  <td
                    className="py-3 px-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onView?.(u.id)}
                        title="View details"
                        className="p-1.5 rounded-lg text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/25 active:scale-90 transition-all"
                      >
                        <Eye size={15} />
                      </button>
                      {renderRowActions?.(u)}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {showEmpty && (
          <EmptyState
            icon={UsersIcon}
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
          users.map((u) => (
            <li
              key={u.id}
              onClick={() => onView?.(u.id)}
              className="bg-white dark:bg-na-card border border-gray-100 dark:border-na-border rounded-xl p-3.5 cursor-pointer active:scale-[.99] transition-transform"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar name={u.name} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 truncate">
                      {u.name}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate">
                      {u.email}
                    </p>
                  </div>
                </div>
                <UserStatusBadge status={u.status} />
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-slate-500 mb-2.5">
                <span>Joined {formatDateTime(u.joinedAt)}</span>
                <span className="font-semibold text-gray-600 dark:text-slate-300">
                  {u.reportsCount ?? 0} report
                  {(u.reportsCount ?? 0) === 1 ? "" : "s"}
                </span>
              </div>

              <div
                className="flex items-center gap-1.5 pt-2.5 border-t border-gray-100 dark:border-na-border"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => onView?.(u.id)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/25 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <Eye size={13} />
                  View
                </button>
                {renderRowActions?.(u)}
              </div>
            </li>
          ))}

        {showEmpty && (
          <li>
            <EmptyState
              icon={UsersIcon}
              title={emptyTitle}
              description={emptyDescription}
            />
          </li>
        )}
      </ul>
    </div>
  );
}
