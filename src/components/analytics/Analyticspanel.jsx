/**
 * AnalyticsPanel.jsx
 *
 * Animated analytics panel showing incident statistics within selected radius.
 * Features:
 * - Animated bar chart for incident types
 * - Total incidents count with animation
 * - Time-based trends
 * - Danger level distribution
 * - Smooth slide-in animation
 */

import React, { useMemo, useEffect, useState } from "react";
import { X, TrendingUp, AlertTriangle, Shield, Clock } from "lucide-react";

// Incident type colors matching the sidebar
const TYPE_COLORS = {
  Robbery: "#dc2626",
  Assault: "#ea580c",
  Snatching: "#ec4899",
  Harassment: "#f43f5e",
  Burglary: "#a855f7",
  Theft: "#f59e0b",
  Vandalism: "#3b82f6",
  "Lost Item": "#0ea5e9",
  "Item Found": "#10b981",
};

const TYPE_EMOJI = {
  Theft: "💰",
  Robbery: "🔫",
  Assault: "🚨",
  Burglary: "🏠",
  Vandalism: "🔨",
  "Lost Item": "📦",
  "Item Found": "✅",
  Snatching: "🏃",
  Harassment: "⚠️",
};

// Animated number counter
function AnimatedNumber({ value, duration = 1000 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(value);
    if (start === end) return;

    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if (
        (increment > 0 && current >= end) ||
        (increment < 0 && current <= end)
      ) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count}</span>;
}

// Animated bar
function AnimatedBar({ percentage, color, delay = 0 }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(percentage), delay);
    return () => clearTimeout(timer);
  }, [percentage, delay]);

  return (
    <div className="relative h-8 bg-gray-100 dark:bg-na-hover rounded-lg overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 rounded-lg transition-all duration-1000 ease-out"
        style={{
          width: `${width}%`,
          backgroundColor: color,
          opacity: 0.9,
        }}
      />
      <div className="absolute inset-0 flex items-center justify-end px-2">
        <span className="text-xs font-bold text-gray-700 dark:text-slate-200">
          {percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

export default function Analyticspanel({
  incidents = [],
  open,
  onClose,
  radius = 5,
}) {
  // Calculate stats
  const stats = useMemo(() => {
    // Group by type
    const byType = {};
    incidents.forEach((inc) => {
      byType[inc.type] = (byType[inc.type] || 0) + 1;
    });

    // Sort by count
    const sortedTypes = Object.entries(byType)
      .sort(([, a], [, b]) => b - a)
      .map(([type, count]) => ({
        type,
        count,
        percentage: (count / incidents.length) * 100,
        color: TYPE_COLORS[type] || "#6b7280",
        emoji: TYPE_EMOJI[type] || "📍",
      }));

    // Time-based analysis (last 24h, last 7 days, older)
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const week = 7 * day;

    let last24h = 0;
    let last7d = 0;
    let older = 0;

    incidents.forEach((inc) => {
      const age = now - new Date(inc.createdAt || 0).getTime();
      if (age < day) last24h++;
      else if (age < week) last7d++;
      else older++;
    });

    // Danger level analysis
    const dangerLevels = { high: 0, moderate: 0, safe: 0 };
    incidents.forEach((inc) => {
      const dangerTypes = ["Robbery", "Assault", "Snatching"];
      const moderateTypes = ["Harassment", "Burglary", "Theft"];

      if (dangerTypes.includes(inc.type)) dangerLevels.high++;
      else if (moderateTypes.includes(inc.type)) dangerLevels.moderate++;
      else dangerLevels.safe++;
    });

    return {
      total: incidents.length,
      byType: sortedTypes,
      timeDistribution: { last24h, last7d, older },
      dangerLevels,
    };
  }, [incidents]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[600] md:hidden"
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className={`
          fixed md:relative right-0 top-0 h-full z-[601]
          w-[90vw] max-w-md md:w-[28%] md:min-w-[320px]
          bg-white dark:bg-na-surface
          border-l border-gray-200 dark:border-na-border
          shadow-2xl md:shadow-none
          flex flex-col
          transition-transform duration-300 ease-out
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-gray-100 dark:border-na-border p-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp
                size={20}
                className="text-blue-600 dark:text-blue-400"
              />
              Analytics
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-na-hover transition-colors"
              aria-label="Close analytics"
            >
              <X size={18} />
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Incidents within {radius}km radius
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Total Count */}
          <div className="bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-900/20 dark:to-violet-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-slate-400 font-medium">
                  Total Incidents
                </p>
                <p className="text-4xl font-bold text-gray-800 dark:text-slate-100 mt-1">
                  <AnimatedNumber value={stats.total} duration={1200} />
                </p>
              </div>
              <div className="w-14 h-14 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white text-2xl">
                📊
              </div>
            </div>
          </div>

          {/* Incident Types */}
          <div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 mb-3 flex items-center gap-2">
              <Shield size={16} className="text-blue-600 dark:text-blue-400" />
              By Type
            </h3>
            <div className="space-y-3">
              {stats.byType.length > 0 ? (
                stats.byType.map((item, idx) => (
                  <div key={item.type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-700 dark:text-slate-200 flex items-center gap-1.5">
                        <span>{item.emoji}</span>
                        {item.type}
                      </span>
                      <span className="text-xs font-bold text-gray-600 dark:text-slate-400">
                        {item.count}
                      </span>
                    </div>
                    <AnimatedBar
                      percentage={item.percentage}
                      color={item.color}
                      delay={idx * 100}
                    />
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-slate-400 text-center py-4">
                  No incidents to display
                </p>
              )}
            </div>
          </div>

          {/* Time Distribution */}
          <div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 mb-3 flex items-center gap-2">
              <Clock size={16} className="text-blue-600 dark:text-blue-400" />
              Time Distribution
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  <AnimatedNumber value={stats.timeDistribution.last24h} />
                </p>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium mt-0.5">
                  Last 24h
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  <AnimatedNumber value={stats.timeDistribution.last7d} />
                </p>
                <p className="text-[10px] text-blue-700 dark:text-blue-300 font-medium mt-0.5">
                  Last 7 days
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-na-hover rounded-lg p-3 border border-gray-200 dark:border-na-border">
                <p className="text-2xl font-bold text-gray-600 dark:text-slate-400">
                  <AnimatedNumber value={stats.timeDistribution.older} />
                </p>
                <p className="text-[10px] text-gray-700 dark:text-slate-400 font-medium mt-0.5">
                  Older
                </p>
              </div>
            </div>
          </div>

          {/* Danger Level Distribution */}
          <div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 mb-3 flex items-center gap-2">
              <AlertTriangle
                size={16}
                className="text-blue-600 dark:text-blue-400"
              />
              Danger Levels
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <span className="text-xs font-semibold text-red-700 dark:text-red-300 flex items-center gap-1.5">
                  🔴 High Risk
                </span>
                <span className="text-sm font-bold text-red-700 dark:text-red-300">
                  <AnimatedNumber value={stats.dangerLevels.high} />
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <span className="text-xs font-semibold text-orange-700 dark:text-orange-300 flex items-center gap-1.5">
                  🟠 Moderate
                </span>
                <span className="text-sm font-bold text-orange-700 dark:text-orange-300">
                  <AnimatedNumber value={stats.dangerLevels.moderate} />
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <span className="text-xs font-semibold text-green-700 dark:text-green-300 flex items-center gap-1.5">
                  🟢 Safe
                </span>
                <span className="text-sm font-bold text-green-700 dark:text-green-300">
                  <AnimatedNumber value={stats.dangerLevels.safe} />
                </span>
              </div>
            </div>
          </div>

          {/* Summary Insight */}
          {stats.total > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1.5">
                💡 Area Insight
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                {stats.dangerLevels.high > stats.total * 0.3
                  ? `High crime activity detected. ${stats.dangerLevels.high} high-risk incidents reported. Stay vigilant and avoid isolated areas.`
                  : stats.timeDistribution.last24h > 3
                    ? `${stats.timeDistribution.last24h} incidents reported in the last 24 hours. Recent activity suggests heightened awareness needed.`
                    : stats.byType[0]
                      ? `Most common incident: ${stats.byType[0].type} (${stats.byType[0].count} reports). Take appropriate precautions.`
                      : "Area appears relatively safe. Continue practicing normal safety measures."}
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
