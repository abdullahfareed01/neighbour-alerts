/**
 * admin/components/IncidentFilters.jsx
 *
 * Controlled filter bar for the Incident Management table. This component
 * intentionally holds NO fetching/debouncing logic itself — it just
 * renders the current `filters` value and reports changes upward via
 * `onChange`. AdminIncidents.jsx owns the actual state and decides how/
 * when to call adminApi with it (including debouncing the free-text
 * search). Keeping this component "dumb" makes it trivial to reason
 * about and reuse.
 *
 * Visual language matches the existing search input in
 * components/layout/Sidebar.jsx (rounded-lg, bg-gray-50/na-input,
 * text-xs, focus:border-blue-400) rather than inventing a new input
 * style. There is no existing <select> anywhere else in the app, so
 * these are hand-styled to match rather than relying on the
 * @tailwindcss/forms "class" strategy, which nothing else in the app
 * currently opts into.
 */
import { Search, X, Calendar } from "lucide-react";
import {
  INCIDENT_TYPE_VALUES,
  TYPE_EMOJI,
} from "../../constants/incidentTypes";
import { SEVERITY_VALUES, SEVERITY_LABEL } from "../constants/severity";
import { STATUS_VALUES, STATUS_LABEL } from "../constants/incidentStatus";

const DEFAULT_INCIDENT_FILTERS = {
  search: "",
  type: "all",
  severity: "all",
  status: "all",
  dateFrom: "",
  dateTo: "",
};

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

export default function IncidentFilters({
  filters,
  onChange,
  onReset,
  resultCount,
  loading = false,
}) {
  const f = { ...DEFAULT_INCIDENT_FILTERS, ...filters };

  const hasActiveFilters =
    f.search.trim() !== "" ||
    f.type !== "all" ||
    f.severity !== "all" ||
    f.status !== "all" ||
    f.dateFrom !== "" ||
    f.dateTo !== "";

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
          placeholder="Search by title or description…"
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

      {/* Category / severity / status / date range */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        <Field label="Category">
          <select
            value={f.type}
            onChange={(e) => set({ type: e.target.value })}
            className={selectCls}
          >
            <option value="all">All categories</option>
            {INCIDENT_TYPE_VALUES.map((t) => (
              <option key={t} value={t}>
                {TYPE_EMOJI[t] ? `${TYPE_EMOJI[t]} ` : ""}
                {t}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Severity">
          <select
            value={f.severity}
            onChange={(e) => set({ severity: e.target.value })}
            className={selectCls}
          >
            <option value="all">All severities</option>
            {SEVERITY_VALUES.map((tier) => (
              <option key={tier} value={tier}>
                {SEVERITY_LABEL[tier]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Status">
          <select
            value={f.status}
            onChange={(e) => set({ status: e.target.value })}
            className={selectCls}
          >
            <option value="all">All statuses</option>
            {STATUS_VALUES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="From date">
          <div className="relative">
            <Calendar
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none"
            />
            <input
              type="date"
              value={f.dateFrom}
              max={f.dateTo || undefined}
              onChange={(e) => set({ dateFrom: e.target.value })}
              className={`${selectCls} pl-7`}
            />
          </div>
        </Field>

        <Field label="To date">
          <div className="relative">
            <Calendar
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none"
            />
            <input
              type="date"
              value={f.dateTo}
              min={f.dateFrom || undefined}
              onChange={(e) => set({ dateTo: e.target.value })}
              className={`${selectCls} pl-7`}
            />
          </div>
        </Field>
      </div>

      {/* Result count + reset */}
      <div className="flex items-center justify-between pt-1">
        <p className="text-[11px] text-gray-400 dark:text-slate-500">
          {loading
            ? "Searching…"
            : typeof resultCount === "number"
              ? `${resultCount} incident${resultCount === 1 ? "" : "s"} found`
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
