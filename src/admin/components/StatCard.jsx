/**
 * admin/components/StatCard.jsx
 * Small metric card for dashboard stat grids. Visual language matches the
 * existing StatBox pattern in pages/UserProfile.jsx (icon chip + value +
 * label) so admin stats feel consistent with the user-facing app.
 */
export default function StatCard({
  label,
  value,
  icon: Icon,
  colorCls = "bg-blue-500",
}) {
  return (
    <div className="bg-white dark:bg-na-surface rounded-2xl p-4 border border-gray-100 dark:border-na-border shadow-sm flex items-center gap-3">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colorCls}`}
      >
        {Icon && <Icon size={19} className="text-white" />}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-800 dark:text-slate-100 leading-none">
          {value}
        </p>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 truncate">
          {label}
        </p>
      </div>
    </div>
  );
}
