/**
 * admin/pages/AdminDashboard.jsx
 *
 * Phase 2 — Admin Overview Dashboard.
 *
 * Data flow: this page ONLY talks to admin/services/adminApi.js
 * (adminIncidentsAPI.getAdminStats / getAdminIncidents). It never imports
 * admin/data/adminMock.js directly. adminApi.js wraps adminMock.js's pure
 * aggregation functions in a simulated network delay + { data } envelope,
 * mirroring services/api.js's real conventions — so when a real backend
 * exists later, only adminApi.js's function bodies change to real HTTP
 * calls; this component (and every other admin page) stays untouched.
 *
 * No wrapper "dark" div — like every other page in this app, dark mode is
 * applied globally via ThemeContext putting "dark" on <html>.
 */
import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  Clock,
  Search,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  TrendingUp,
  Layers,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

import StatCard from "../components/StatCard";
import SummaryBars from "../components/SummaryBar";
import TrendChart from "../components/Trendchart";
import RecentIncidents from "../components/RecentIncidents";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";

import { adminIncidentsAPI } from "../services/adminApi";
import { STATUS_LABEL, STATUS_DOT_COLOR } from "../constants/incidentStatus";
import { TYPE_HEX_COLOR, TYPE_EMOJI } from "../../constants/incidentTypes";

const RECENT_LIMIT = 6;

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      adminIncidentsAPI.getAdminStats(),
      adminIncidentsAPI.getAdminIncidents({ limit: RECENT_LIMIT }),
    ])
      .then(([statsRes, incidentsRes]) => {
        setStats(statsRes.data.stats);
        setRecent(incidentsRes.data.incidents);
      })
      .catch(() => setError("Failed to load dashboard data. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <LoadingState label="Loading dashboard…" />;
  }

  if (error || !stats) {
    return (
      <div className="bg-white dark:bg-na-surface rounded-2xl border border-gray-100 dark:border-na-border shadow-sm">
        <EmptyState
          icon={AlertTriangle}
          title="Couldn't load the dashboard"
          description={error ?? "Something went wrong while fetching admin stats."}
        />
        <div className="pb-6 flex justify-center">
          <button
            onClick={load}
            className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/25 px-3 py-1.5 rounded-lg transition-colors"
          >
            <RefreshCw size={12} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Map the raw statusBreakdown (status/count/percentage) coming back from
  // the service layer into the { key, label, count, percentage, color }
  // shape SummaryBars expects — display-only formatting, not data fetching.
  const statusItems = stats.statusBreakdown.map((s) => ({
    key: s.status,
    label: STATUS_LABEL[s.status] ?? s.status,
    count: s.count,
    percentage: s.percentage,
    color: STATUS_DOT_COLOR[s.status] ?? "#94a3b8",
  }));

  const categoryItems = stats.categoryBreakdown.map((c) => ({
    key: c.type,
    label: c.type,
    count: c.count,
    percentage: c.percentage,
    color: TYPE_HEX_COLOR[c.type] ?? "#6b7280",
    emoji: TYPE_EMOJI[c.type],
  }));

  return (
    <div className="space-y-5">
      {/* ── Stat grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Total Incidents"
          value={stats.total}
          icon={BarChart3}
          colorCls="bg-blue-600"
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          icon={Clock}
          colorCls="bg-amber-500"
        />
        <StatCard
          label="Under Review"
          value={stats.underReview}
          icon={Search}
          colorCls="bg-indigo-500"
        />
        <StatCard
          label="Verified"
          value={stats.verified}
          icon={ShieldCheck}
          colorCls="bg-violet-500"
        />
        <StatCard
          label="Resolved"
          value={stats.resolved}
          icon={CheckCircle2}
          colorCls="bg-emerald-500"
        />
        <StatCard
          label="Reported Today"
          value={stats.reportedToday}
          icon={Calendar}
          colorCls="bg-rose-500"
        />
      </div>

      {/* ── Summaries + trend ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SummaryBars
          title="Incident Status Summary"
          icon={Layers}
          items={statusItems}
        />
        <SummaryBars
          title="Incident Category Summary"
          icon={BarChart3}
          items={categoryItems}
        />

        <div className="bg-white dark:bg-na-surface rounded-2xl p-4 border border-gray-100 dark:border-na-border shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-600 dark:text-blue-400" />
            Incidents — Last 7 Days
          </h3>
          <TrendChart data={stats.trend} />
        </div>
      </div>

      {/* ── Recent incidents preview ──────────────────────────────────── */}
      <RecentIncidents incidents={recent} />
    </div>
  );
}
