/**
 * admin/components/TrendChart.jsx
 * Basic incident-trend visualization — a small hand-rolled vertical bar
 * chart (CSS height transition, no charting library), matching the
 * project's existing animated-visualization approach.
 */
import { useEffect, useState } from "react";

export default function TrendChart({ data = [] }) {
  const [grown, setGrown] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setGrown(true), 80);
    return () => clearTimeout(t);
  }, [data]);

  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="flex items-end justify-between gap-2 h-32 px-1">
      {data.map((d, idx) => {
        const heightPct = grown ? Math.max(4, (d.count / max) * 100) : 0;
        return (
          <div
            key={`${d.label}-${idx}`}
            className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
          >
            <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400">
              {d.count}
            </span>
            <div className="w-full h-full flex items-end">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400 dark:from-blue-700 dark:to-blue-400 transition-all duration-700 ease-out"
                style={{
                  height: `${heightPct}%`,
                  transitionDelay: `${idx * 60}ms`,
                }}
              />
            </div>
            <span className="text-[10px] text-gray-400 dark:text-slate-500">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
