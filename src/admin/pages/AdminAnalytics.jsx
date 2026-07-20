/**
 * admin/pages/AdminAnalytics.jsx
 *
 * Phase 6 — Admin Analytics.
 *
 * Data flow mirrors AdminDashboard.jsx exactly: this page ONLY talks to
 * admin/services/adminApi.js (adminAnalyticsAPI.getAdminAnalytics), never
 * imports admin/data/adminAnalyticsMock.js directly. adminApi.js wraps
 * that module's pure aggregation functions in a simulated network delay +
 * { data } envelope, so swapping in a real backend later only means
 * changing adminAnalyticsAPI's function body — this component doesn't
 * change at all.
 *
 * Visualization approach reuses the app's existing hand-rolled
 * components — no new charting library:
 *   - TrendChart   → incidents over time (already built for the
 *                    dashboard's 7-day trend; reused here for 14 days)
 *   - SummaryBars  → every label/count/percentage breakdown (category,
 *                    severity, status, areas, resolution outcomes, top
 *                    reporters, user account status) — it's already a
 *                    generic bar-list component, so no new component was
 *                    needed for any of these
 *   - StatCard     → headline numbers
 *   - AnalyticsCard→ new, small reusable wrapper for the one section
 *                    (trend chart) that isn't already self-wrapping
 *
 * No wrapper "dark" div — like every other admin page, dark mode is
 * applied globally via ThemeContext putting "dark" on <html>.
 */
import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

import StatCard from "../components/StatCard";
import SummaryBars from "../components/SummaryBar";
import TrendChart from "../components/Trendchart";
import AnalyticsCard from "../components/AnalyticsCard";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";

import { adminAnalyticsAPI } from "../services/adminApi";
import { STATUS_LABEL, STATUS_DOT_COLOR } from "../constants/incidentStatus";
import { SEVERITY_LABEL, SEVERITY_DOT_COLOR } from "../constants/severity";
import {
  USER_STATUS_LABEL,
  USER_STATUS_DOT_COLOR,
} from "../constants/userStatus";
import { TYPE_HEX_COLOR, TYPE_EMOJI } from "../../constants/incidentTypes";

// Fixed palette for "Most Affected Areas" — areas have no inherent color
// (unlike incident type/status/severity, which already have single-
// source-of-truth color maps), so this just cycles a few of the app's
// existing accent colors in rank order.
const AREA_COLORS = ["#2563eb", "#8b5cf6", "#10b981", "#f59e0b", "#f43f5e"];

function formatDuration(hours) {
  if (!hours || hours <= 0) return "—";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 48) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    adminAnalyticsAPI
      .getAdminAnalytics()
      .then(({ data }) => setAnalytics(data.analytics))
      .catch(() => setError("Failed to load analytics. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <LoadingState label="Loading analytics…" />;
  }

  if (error || !analytics) {
    return (
      <div className="bg-white dark:bg-na-surface rounded-2xl border border-gray-100 dark:border-na-border shadow-sm">
        <EmptyState
          icon={AlertTriangle}
          title="Couldn't load analytics"
          description={
            error ?? "Something went wrong while fetching analytics data."
          }
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

  // ── Shape raw analytics numbers into the { key, label, count,
  // percentage, color, emoji? } shape SummaryBars expects — display-only
  // formatting, same pattern AdminDashboard.jsx already uses for its own
  // statusItems/categoryItems.
  const categoryItems = analytics.categoryBreakdown.map((c) => ({
    key: c.type,
    label: c.type,
    count: c.count,
    percentage: c.percentage,
    color: TYPE_HEX_COLOR[c.type] ?? "#6b7280",
    emoji: TYPE_EMOJI[c.type],
  }));

  const severityItems = analytics.severityBreakdown.map((s) => ({
    key: s.tier,
    label: SEVERITY_LABEL[s.tier] ?? s.tier,
    count: s.count,
    percentage: s.percentage,
    color: SEVERITY_DOT_COLOR[s.tier] ?? "#6b7280",
  }));

  const statusItems = analytics.statusBreakdown.map((s) => ({
    key: s.status,
    label: STATUS_LABEL[s.status] ?? s.status,
    count: s.count,
    percentage: s.percentage,
    color: STATUS_DOT_COLOR[s.status] ?? "#94a3b8",
  }));

  const areaItems = analytics.areaBreakdown.map((a, idx) => ({
    key: a.id,
    label: a.label,
    count: a.count,
    percentage: a.percentage,
    color: AREA_COLORS[idx % AREA_COLORS.length],
  }));

  // Outcome colors reuse the existing status dot-color map (resolved /
  // rejected already have colors; "Still Open" borrows pending's amber
  // as a stand-in for "still in the pipeline") rather than inventing a
  // second color language just for this one section.
  const outcomeItems = analytics.resolutionStats.outcomeBreakdown.map((o) => ({
    key: o.key,
    label: o.label,
    count: o.count,
    percentage: o.percentage,
    color:
      o.key === "resolved"
        ? STATUS_DOT_COLOR.resolved
        : o.key === "rejected"
          ? STATUS_DOT_COLOR.rejected
          : STATUS_DOT_COLOR.pending,
  }));

  const userStatusItems = analytics.userActivity.statusBreakdown.map((s) => ({
    key: s.status,
    label: USER_STATUS_LABEL[s.status] ?? s.status,
    count: s.count,
    percentage: s.percentage,
    color: USER_STATUS_DOT_COLOR[s.status] ?? "#94a3b8",
  }));

  // Top reporters' bars are scaled relative to the top reporter's own
  // count (leader = 100%) rather than as a % of all incidents, since a
  // single user's share of total reports is normally tiny — the relative
  // comparison is what's actually useful in a leaderboard.
  const topReporters = analytics.userActivity.topReporters;
  const maxReports = topReporters.length ? topReporters[0].reportsCount : 0;
  const topReporterItems = topReporters.map((u) => ({
    key: u.id,
    label: u.name,
    count: u.reportsCount,
    percentage: maxReports ? (u.reportsCount / maxReports) * 100 : 0,
    color: "#3b82f6",
  }));

  return (
    <div className="space-y-5">
      {/* ── Headline stats ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          label="Total Incidents"
          value={analytics.totalIncidents}
          icon={BarChart3}
          colorCls="bg-blue-600"
        />
        <StatCard
          label="Resolution Rate"
          value={`${analytics.resolutionStats.resolutionRate.toFixed(0)}%`}
          icon={CheckCircle2}
          colorCls="bg-emerald-500"
        />
        <StatCard
          label="Avg. Resolution Time"
          value={formatDuration(analytics.resolutionStats.avgResolutionHours)}
          icon={Clock}
          colorCls="bg-violet-500"
        />
        <StatCard
          label="Registered Users"
          value={analytics.userActivity.totalUsers}
          icon={Users}
          colorCls="bg-indigo-500"
        />
        <StatCard
          label="Reporting Participation"
          value={`${analytics.userActivity.participationRate.toFixed(0)}%`}
          icon={TrendingUp}
          colorCls="bg-rose-500"
        />
      </div>

      {/* ── Incidents over time ───────────────────────────────────────── */}
      <AnalyticsCard
        title="Incidents Over Time"
        icon={TrendingUp}
        subtitle="Daily incident volume — last 14 days"
      >
        <TrendChart data={analytics.trend} />
      </AnalyticsCard>

      {/* ── Category + Severity ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SummaryBars
          title="Incidents by Category"
          icon={BarChart3}
          items={categoryItems}
        />
        <SummaryBars
          title="Incidents by Severity"
          icon={AlertTriangle}
          items={severityItems}
        />
      </div>

      {/* ── Status + Most affected areas ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SummaryBars
          title="Incidents by Status"
          icon={Layers}
          items={statusItems}
        />
        <SummaryBars
          title="Most Affected Areas"
          icon={MapPin}
          items={areaItems}
        />
      </div>

      {/* ── Resolution statistics ─────────────────────────────────────── */}
      <SummaryBars
        title="Resolution Outcomes"
        icon={CheckCircle2}
        items={outcomeItems}
      />

      {/* ── User reporting activity ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SummaryBars
          title="Top Reporters"
          icon={Users}
          items={topReporterItems}
        />
        <SummaryBars
          title="User Account Status"
          icon={ShieldCheck}
          items={userStatusItems}
        />
      </div>
    </div>
  );
}
