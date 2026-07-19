/**
 * admin/components/Pagination.jsx
 * Minimal prev/next pagination bar. Deliberately avoids numbered page
 * buttons / chevron icons — ArrowLeft/ArrowRight are already proven to
 * exist in this project's pinned lucide-react version (used in
 * Register.jsx and Sidebar.jsx), so reusing them here keeps the build
 * safe instead of guessing at an unverified icon name.
 */
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function Pagination({
  page = 1,
  totalPages = 1,
  totalCount = 0,
  pageSize = 10,
  onPageChange,
}) {
  if (totalCount === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const btnCls = (enabled) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
      enabled
        ? "text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-na-hover hover:bg-gray-100 dark:hover:bg-na-border active:scale-95"
        : "text-gray-300 dark:text-slate-600 bg-gray-50 dark:bg-na-hover/50 cursor-not-allowed"
    }`;

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap px-1">
      <p className="text-[11px] text-gray-400 dark:text-slate-500">
        Showing{" "}
        <span className="font-semibold text-gray-600 dark:text-slate-300">
          {start}–{end}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-gray-600 dark:text-slate-300">
          {totalCount}
        </span>
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => canPrev && onPageChange?.(page - 1)}
          disabled={!canPrev}
          className={btnCls(canPrev)}
        >
          <ArrowLeft size={13} />
          Prev
        </button>
        <span className="text-[11px] text-gray-400 dark:text-slate-500 px-1">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => canNext && onPageChange?.(page + 1)}
          disabled={!canNext}
          className={btnCls(canNext)}
        >
          Next
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
