/**
 * admin/components/SummaryBars.jsx
 * Generic animated horizontal-bar breakdown list. Reused for both the
 * Incident Status Summary and the Incident Category Summary on the admin
 * dashboard.
 *
 * Deliberately hand-rolled (CSS width transition, no charting library) —
 * same visual approach as the AnimatedBar used in
 * components/analytics/Analyticspanel.jsx, kept consistent with
 * CLAUDE.md's "basic incident trends using the existing hand-rolled
 * visualization approach" instruction and "do not install a charting
 * library."
 */
import { useEffect, useState } from "react";

function Bar({ percentage, color, delay = 0 }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(percentage), delay);
    return () => clearTimeout(t);
  }, [percentage, delay]);

  return (
    <div className="relative h-7 bg-gray-100 dark:bg-na-hover rounded-lg overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 rounded-lg transition-all duration-1000 ease-out"
        style={{ width: `${width}%`, backgroundColor: color, opacity: 0.9 }}
      />
      <div className="absolute inset-0 flex items-center justify-end px-2">
        <span className="text-[11px] font-bold text-gray-700 dark:text-slate-200">
          {percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

/**
 * @param {{ title: string, icon?: Component, items: Array<{
 *   key: string, label: string, count: number, percentage: number,
 *   color: string, emoji?: string
 * }> }} props
 */
export default function SummaryBars({ title, icon: Icon, items = [] }) {
  return (
    <div className="bg-white dark:bg-na-surface rounded-2xl p-4 border border-gray-100 dark:border-na-border shadow-sm">
      <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 mb-3 flex items-center gap-2">
        {Icon && (
          <Icon size={16} className="text-blue-600 dark:text-blue-400" />
        )}
        {title}
      </h3>

      {items.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-slate-500 text-center py-6">
          No data to display
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={item.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-700 dark:text-slate-200 flex items-center gap-1.5 truncate">
                  {item.emoji && <span>{item.emoji}</span>}
                  {item.label}
                </span>
                <span className="text-xs font-bold text-gray-500 dark:text-slate-400 shrink-0 ml-2">
                  {item.count}
                </span>
              </div>
              <Bar
                percentage={item.percentage}
                color={item.color}
                delay={idx * 90}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
