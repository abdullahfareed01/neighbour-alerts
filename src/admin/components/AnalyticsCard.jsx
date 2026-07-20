/**
 * admin/components/AnalyticsCard.jsx
 *
 * Generic bordered card wrapper (icon + title + optional subtitle, then
 * body) for Admin Analytics sections. Extracted from the card markup
 * that was already being inlined around TrendChart on
 * AdminDashboard.jsx, so Analytics.jsx's several sections don't each
 * re-type the same header/border/shadow classes.
 *
 * Not used for every Analytics section — SummaryBars and StatCard
 * already render their own self-contained card shell, so this is only
 * needed for sections wrapping a plain chart/body (e.g. the incidents
 * trend chart).
 */
export default function AnalyticsCard({
  title,
  icon: Icon,
  subtitle,
  children,
}) {
  return (
    <div className="bg-white dark:bg-na-surface rounded-2xl p-4 border border-gray-100 dark:border-na-border shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
          {Icon && (
            <Icon size={16} className="text-blue-600 dark:text-blue-400" />
          )}
          {title}
        </h3>
        {subtitle && (
          <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}
