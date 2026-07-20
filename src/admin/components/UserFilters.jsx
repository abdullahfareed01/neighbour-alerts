/**
 * admin/components/UserFilters.jsx
 *
 * Controlled filter bar for the User Management table — search (name or
 * email) + account status. Holds no fetching/debouncing logic itself, the
 * same "dumb, controlled" split IncidentFilters.jsx documents in its own
 * header: it renders `filters` and reports changes upward via `onChange`;
 * AdminUsers.jsx owns the actual state and decides how/when to call the
 * admin service layer with it (including debouncing free-text search).
 *
 * CLAUDE.md §6 only calls for "basic filtering" for User Management, so
 * this intentionally stays to search + status rather than growing the
 * five-field grid IncidentFilters.jsx has for incidents.
 */
import { Search, X } from "lucide-react";
import { USER_STATUS_VALUES, USER_STATUS_LABEL } from "../constants/userStatus";

const DEFAULT_USER_FILTERS = { search: "", status: "all" };

const selectCls =
  "w-full px-3 py-2 rounded-lg text-xs font-medium border " +
  "bg-gray-50 dark:bg-na-input text-gray-700 dark:text-slate-200 " +
  "border-gray-200 dark:border-na-border " +
  "hover:bg-white dark:hover:bg-na-hover " +
  "focus:outline-none focus:bg-white dark:focus:bg-na-input focus:border-blue-400 dark:focus:border-na-border " +
  "transition-colors duration-150";

function Field({ label, children }) {
  return (
    <div className="min-w-0">
      <label className="block text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function UserFilters({
  filters,
  onChange,
  onReset,
  resultCount,
  loading = false,
}) {
  const f = { ...DEFAULT_USER_FILTERS, ...filters };

  const hasActiveFilters = f.search.trim() !== "" || f.status !== "all";

  const set = (patch) => onChange?.(patch);

  return (
    <div className="bg-white dark:bg-na-surface rounded-2xl p-4 border border-gray-100 dark:border-na-border shadow-sm space-y-3">
      {/* Search */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none"
        />
        <input
          type="text"
          value={f.search}
          onChange={(e) => set({ search: e.target.value })}
          placeholder="Search by name or email…"
          className="w-full pl-9 pr-8 py-2.5 rounded-lg text-sm
            bg-gray-50 dark:bg-na-input
            text-gray-700 dark:text-slate-200
            placeholder-gray-400 dark:placeholder-slate-500
            border border-gray-200 dark:border-na-border
            hover:bg-white dark:hover:bg-na-hover
            focus:outline-none focus:bg-white dark:focus:bg-na-input focus:border-blue-400 dark:focus:border-na-border
            transition-colors duration-150"
        />
        {f.search && (
          <button
            type="button"
            onClick={() => set({ search: "" })}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
            aria-label="Clear search"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <Field label="Status">
          <select
            value={f.status}
            onChange={(e) => set({ status: e.target.value })}
            className={selectCls}
          >
            <option value="all">All statuses</option>
            {USER_STATUS_VALUES.map((s) => (
              <option key={s} value={s}>
                {USER_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Result count + reset */}
      <div className="flex items-center justify-between pt-1">
        <p className="text-[11px] text-gray-400 dark:text-slate-500">
          {loading
            ? "Searching…"
            : typeof resultCount === "number"
              ? `${resultCount} user${resultCount === 1 ? "" : "s"} found`
              : ""}
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/25 px-2 py-1 rounded-lg transition-colors"
          >
            <X size={11} />
            Reset filters
          </button>
        )}
      </div>
    </div>
  );
}
