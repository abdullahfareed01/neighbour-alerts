/**
 * admin/data/adminAnalyticsMock.js
 *
 * Phase 6 — Admin Analytics.
 *
 * PURE (no side effects, no async) aggregation helpers for the Analytics
 * page, following the exact convention adminMock.js / adminUsersMock.js
 * already established: plain functions over MOCK_ADMIN_INCIDENTS /
 * MOCK_ADMIN_USERS, no fetching, no adminApi.js-specific concerns. This
 * keeps adminApi.js's job limited to "shape a response envelope +
 * simulate network delay" around these, exactly like every other admin
 * endpoint.
 *
 * Kept in its own file (rather than growing adminMock.js further) because
 * these functions serve a different concern — cross-cutting analytics
 * that reads BOTH incidents and users — mirroring why adminUsersMock.js
 * was already split out from adminMock.js.
 *
 * Wherever a computation already exists elsewhere (category breakdown,
 * daily trend), this file reuses it instead of recomputing the same
 * thing a second way — see the imports from "./adminMock" below.
 */
import {
  MOCK_ADMIN_INCIDENTS,
  computeCategoryBreakdown,
  computeTrend,
} from "./adminMock";
import { MOCK_ADMIN_USERS, getUserReportCount } from "./adminUsersMock";
import { STATUS_VALUES } from "../constants/incidentStatus";
import { SEVERITY_VALUES, getSeverityTier } from "../constants/severity";
import { USER_STATUS_VALUES } from "../constants/userStatus";
import { getDistanceFromLatLonInKm } from "../../utils/haversine";

// ─── Severity breakdown ────────────────────────────────────────────────────────

/** Incident count + share per severity tier (high/moderate/safe), tiered
 *  the same way SeverityBadge.jsx does — via getSeverityTier(). */
export function computeSeverityBreakdown(incidents = MOCK_ADMIN_INCIDENTS) {
  const counts = SEVERITY_VALUES.reduce((acc, tier) => {
    acc[tier] = 0;
    return acc;
  }, {});

  incidents.forEach((inc) => {
    const tier = getSeverityTier(inc.type);
    if (counts[tier] !== undefined) counts[tier] += 1;
  });

  const total = incidents.length;
  return SEVERITY_VALUES.map((tier) => ({
    tier,
    count: counts[tier],
    percentage: total ? (counts[tier] / total) * 100 : 0,
  }));
}

// ─── Status breakdown (standalone — Analytics doesn't need the rest of
// computeAdminStats' payload, just this slice) ─────────────────────────────────

export function computeStatusBreakdown(incidents = MOCK_ADMIN_INCIDENTS) {
  const counts = STATUS_VALUES.reduce((acc, s) => {
    acc[s] = 0;
    return acc;
  }, {});

  incidents.forEach((inc) => {
    if (counts[inc.status] !== undefined) counts[inc.status] += 1;
  });

  const total = incidents.length;
  return STATUS_VALUES.map((status) => ({
    status,
    count: counts[status],
    percentage: total ? (counts[status] / total) * 100 : 0,
  }));
}

// ─── Most affected areas ───────────────────────────────────────────────────────
//
// The seed incidents (adminMock.js) only carry raw lat/lng — no place
// name. Rather than pulling in a geocoding API/dependency for a mock
// dataset, incidents are bucketed into a small fixed set of named
// Karachi-area zones by nearest-neighbor distance, reusing the existing
// utils/haversine.js helper (no new dependency). This is a deliberately
// lightweight approximation for demo purposes, not a real geocoder.
const ANALYTICS_ZONES = [
  { id: "dha-phase6", label: "DHA Phase 6", lat: 24.965, lng: 67.075 },
  { id: "clifton", label: "Clifton", lat: 24.975, lng: 67.03 },
  { id: "gulshan-e-iqbal", label: "Gulshan-e-Iqbal", lat: 24.92, lng: 67.05 },
  { id: "pechs", label: "PECHS", lat: 24.945, lng: 67.095 },
  { id: "bahadurabad", label: "Bahadurabad", lat: 24.93, lng: 67.07 },
];

function nearestZone(lat, lng) {
  let best = ANALYTICS_ZONES[0];
  let bestDistance = Infinity;
  for (const zone of ANALYTICS_ZONES) {
    const d = getDistanceFromLatLonInKm(lat, lng, zone.lat, zone.lng);
    if (d < bestDistance) {
      bestDistance = d;
      best = zone;
    }
  }
  return best;
}

/** Top-N zones by incident count, newest-agnostic (all incidents count
 *  equally regardless of age — "most affected", not "currently active"). */
export function computeAreaBreakdown(
  incidents = MOCK_ADMIN_INCIDENTS,
  topN = 5,
) {
  const counts = {};
  incidents.forEach((inc) => {
    if (typeof inc.lat !== "number" || typeof inc.lng !== "number") return;
    const zone = nearestZone(inc.lat, inc.lng);
    counts[zone.id] = (counts[zone.id] ?? 0) + 1;
  });

  const total = incidents.length;
  return ANALYTICS_ZONES.map((zone) => ({
    id: zone.id,
    label: zone.label,
    count: counts[zone.id] ?? 0,
    percentage: total ? ((counts[zone.id] ?? 0) / total) * 100 : 0,
  }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

// ─── Resolution statistics ─────────────────────────────────────────────────────

/** Resolved / rejected / still-open counts + rates, plus the average time
 *  (in hours) from an incident's createdAt to the "resolved" entry in its
 *  statusHistory (seeded by adminMock.js's buildStatusHistory, and kept
 *  up to date live by adminApi.updateIncidentStatus). */
export function computeResolutionStats(incidents = MOCK_ADMIN_INCIDENTS) {
  const total = incidents.length;
  const resolved = incidents.filter((inc) => inc.status === "resolved");
  const rejected = incidents.filter((inc) => inc.status === "rejected");
  const open = incidents.filter(
    (inc) => inc.status !== "resolved" && inc.status !== "rejected",
  );

  const resolutionRate = total ? (resolved.length / total) * 100 : 0;
  const rejectionRate = total ? (rejected.length / total) * 100 : 0;
  const openRate = total ? (open.length / total) * 100 : 0;

  const resolutionHours = resolved.map((inc) => {
    const resolvedEntry = (inc.statusHistory ?? []).find(
      (h) => h.status === "resolved",
    );
    const resolvedAt = resolvedEntry
      ? new Date(resolvedEntry.at)
      : new Date(inc.createdAt);
    const createdAt = new Date(inc.createdAt);
    return Math.max(0, (resolvedAt - createdAt) / (1000 * 60 * 60));
  });

  const avgResolutionHours = resolutionHours.length
    ? resolutionHours.reduce((a, b) => a + b, 0) / resolutionHours.length
    : 0;

  return {
    total,
    resolvedCount: resolved.length,
    rejectedCount: rejected.length,
    openCount: open.length,
    resolutionRate,
    rejectionRate,
    openRate,
    avgResolutionHours,
    outcomeBreakdown: [
      {
        key: "resolved",
        label: "Resolved",
        count: resolved.length,
        percentage: resolutionRate,
      },
      {
        key: "rejected",
        label: "Rejected",
        count: rejected.length,
        percentage: rejectionRate,
      },
      {
        key: "open",
        label: "Still Open",
        count: open.length,
        percentage: openRate,
      },
    ],
  };
}

// ─── User reporting activity ───────────────────────────────────────────────────

/** Registered-user totals, active/suspended split, reporting
 *  participation rate, and a top-reporters leaderboard — reuses
 *  getUserReportCount() (adminUsersMock.js) instead of a second count. */
export function computeUserReportingActivity(
  users = MOCK_ADMIN_USERS,
  incidents = MOCK_ADMIN_INCIDENTS,
  topN = 5,
) {
  const totalUsers = users.length;

  const usersWithReports = users.filter(
    (u) => getUserReportCount(u.id, incidents) > 0,
  );
  const participationRate = totalUsers
    ? (usersWithReports.length / totalUsers) * 100
    : 0;

  const statusCounts = USER_STATUS_VALUES.reduce((acc, s) => {
    acc[s] = 0;
    return acc;
  }, {});
  users.forEach((u) => {
    if (statusCounts[u.status] !== undefined) statusCounts[u.status] += 1;
  });

  const topReporters = users
    .map((u) => ({
      id: u.id,
      name: u.name,
      reportsCount: getUserReportCount(u.id, incidents),
    }))
    .filter((u) => u.reportsCount > 0)
    .sort((a, b) => b.reportsCount - a.reportsCount)
    .slice(0, topN);

  return {
    totalUsers,
    reportersCount: usersWithReports.length,
    participationRate,
    statusBreakdown: USER_STATUS_VALUES.map((status) => ({
      status,
      count: statusCounts[status],
      percentage: totalUsers ? (statusCounts[status] / totalUsers) * 100 : 0,
    })),
    topReporters,
  };
}

// ─── Aggregate payload ──────────────────────────────────────────────────────────

/** Single entry point the service layer calls — bundles every Analytics
 *  section's data in one payload, mirroring computeAdminStats()'s
 *  "everything the page needs in one call" shape from adminMock.js. */
export function computeAdminAnalytics({
  incidents = MOCK_ADMIN_INCIDENTS,
  users = MOCK_ADMIN_USERS,
  trendDays = 14,
} = {}) {
  return {
    totalIncidents: incidents.length,
    trend: computeTrend(incidents, trendDays),
    categoryBreakdown: computeCategoryBreakdown(incidents),
    severityBreakdown: computeSeverityBreakdown(incidents),
    statusBreakdown: computeStatusBreakdown(incidents),
    areaBreakdown: computeAreaBreakdown(incidents),
    resolutionStats: computeResolutionStats(incidents),
    userActivity: computeUserReportingActivity(users, incidents),
  };
}
