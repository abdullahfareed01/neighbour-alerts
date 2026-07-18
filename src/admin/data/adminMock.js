/**
 * admin/data/adminMock.js
 *
 * Realistic mock incident dataset for the admin dashboard, plus PURE
 * (no side effects, no async) aggregation helpers that compute the stats
 * adminApi.js's admin endpoints return.
 *
 * Deliberately reuses INCIDENT_TYPE_VALUES / TYPE_EMOJI from
 * constants/incidentTypes.js (the app's existing single source of truth
 * for incident type metadata) instead of inventing a second type list, so
 * admin category summaries always match the same categories/emoji the
 * user-facing app uses.
 *
 * Keeping the raw dataset + computation logic here (rather than inline in
 * adminApi.js) means adminApi.js's job stays limited to "shape a response
 * envelope + simulate network delay" — exactly what will need to change
 * (and *only* what will need to change) when these functions are replaced
 * by real HTTP calls to a backend that does this aggregation server-side.
 */
import { STATUS_VALUES } from "../constants/incidentStatus";

const hoursAgo = (h) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString();

// Karachi/DHA-area coordinates, consistent with data/incidents.js and
// context/LocationContext.jsx's DEFAULT_LOCATION.
const templates = [
  {
    title: "Motorcycle stolen near Clifton",
    type: "Theft",
    reporter: "Ali Khan",
    lat: 24.9821,
    lng: 67.0792,
    hoursAgo: 2,
  },
  {
    title: "Street robbery on main boulevard",
    type: "Robbery",
    reporter: "Sara Malik",
    lat: 24.9153,
    lng: 67.1085,
    hoursAgo: 5,
  },
  {
    title: "Fight reported outside café",
    type: "Assault",
    reporter: "Zain Malik",
    lat: 24.9387,
    lng: 67.0965,
    hoursAgo: 8,
  },
  {
    title: "House break-in reported in DHA",
    type: "Burglary",
    reporter: "Fatima Sheikh",
    lat: 24.9312,
    lng: 67.0728,
    hoursAgo: 12,
  },
  {
    title: "Car keyed in parking lot",
    type: "Vandalism",
    reporter: "Omar Farooq",
    lat: 24.9608,
    lng: 67.0981,
    hoursAgo: 20,
  },
  {
    title: "Wallet lost near market",
    type: "Lost Item",
    reporter: "Nadia Hussain",
    lat: 24.9284,
    lng: 67.0882,
    hoursAgo: 22,
  },
  {
    title: "Street harassment reported near mall",
    type: "Harassment",
    reporter: "Bilal Chaudhry",
    lat: 24.9571,
    lng: 67.0632,
    hoursAgo: 30,
  },
  {
    title: "Blue backpack found near creek",
    type: "Item Found",
    reporter: "Ayesha Khan",
    lat: 24.921,
    lng: 67.0299,
    hoursAgo: 34,
  },
  {
    title: "Phone snatched near bus stop",
    type: "Snatching",
    reporter: "Hamza Raza",
    lat: 24.9735,
    lng: 67.0217,
    hoursAgo: 40,
  },
  {
    title: "Bag snatched near signal",
    type: "Theft",
    reporter: "Sara Ali",
    lat: 24.9785,
    lng: 67.0501,
    hoursAgo: 48,
  },
  {
    title: "ATM robbed at night",
    type: "Robbery",
    reporter: "Ahmed Raza",
    lat: 24.9327,
    lng: 67.0993,
    hoursAgo: 55,
  },
  {
    title: "Minor fight outside restaurant",
    type: "Assault",
    reporter: "Fatima Ali",
    lat: 24.9372,
    lng: 67.0619,
    hoursAgo: 60,
  },
  {
    title: "Shop break-in reported",
    type: "Burglary",
    reporter: "Omar Khan",
    lat: 24.9457,
    lng: 67.0711,
    hoursAgo: 70,
  },
  {
    title: "Graffiti vandalism on street wall",
    type: "Vandalism",
    reporter: "Ayesha Malik",
    lat: 24.9175,
    lng: 67.0567,
    hoursAgo: 78,
  },
  {
    title: "ID card lost near office",
    type: "Lost Item",
    reporter: "Bilal Ahmed",
    lat: 24.9748,
    lng: 67.0629,
    hoursAgo: 90,
  },
  {
    title: "Followed on road near bus stop",
    type: "Harassment",
    reporter: "Sara Noor",
    lat: 24.9271,
    lng: 67.0335,
    hoursAgo: 100,
  },
  {
    title: "Phone found near shop",
    type: "Item Found",
    reporter: "Zain Ali",
    lat: 24.9532,
    lng: 67.0821,
    hoursAgo: 110,
  },
  {
    title: "Laptop snatched from parked car",
    type: "Snatching",
    reporter: "Fatima Noor",
    lat: 24.9653,
    lng: 67.0245,
    hoursAgo: 120,
  },
  {
    title: "Car stolen from parking lot",
    type: "Theft",
    reporter: "Ali Raza",
    lat: 24.9675,
    lng: 67.0905,
    hoursAgo: 130,
  },
  {
    title: "Shop robbery reported",
    type: "Robbery",
    reporter: "Sara Khan",
    lat: 24.9199,
    lng: 67.0473,
    hoursAgo: 145,
  },
  {
    title: "Scuffle reported near park",
    type: "Assault",
    reporter: "Hamza Sheikh",
    lat: 24.9448,
    lng: 67.0512,
    hoursAgo: 160,
  },
  {
    title: "Attempted break-in overnight",
    type: "Burglary",
    reporter: "Nadia Farooq",
    lat: 24.9296,
    lng: 67.0854,
    hoursAgo: 175,
  },
  {
    title: "Fence spray-painted overnight",
    type: "Vandalism",
    reporter: "Omar Raza",
    lat: 24.9541,
    lng: 67.0398,
    hoursAgo: 190,
  },
  {
    title: "Bicycle left unattended, now missing",
    type: "Lost Item",
    reporter: "Ayesha Raza",
    lat: 24.9633,
    lng: 67.0712,
    hoursAgo: 205,
  },
];

// Cycle through statuses deterministically so the mix is realistic and
// repeatable (not random) across renders/reloads.
const STATUS_CYCLE = STATUS_VALUES; // ["pending","under_review","verified","resolved","rejected"]

export const MOCK_ADMIN_INCIDENTS = templates.map((t, i) => ({
  id: `admin-inc-${String(i + 1).padStart(3, "0")}`,
  title: t.title,
  description: `${t.title}. Reported via the community app for review.`,
  type: t.type,
  status: STATUS_CYCLE[i % STATUS_CYCLE.length],
  lat: t.lat,
  lng: t.lng,
  reporterId: `user-${String(i + 1).padStart(3, "0")}`,
  reporterName: t.reporter,
  views: (i * 7) % 40,
  createdAt: hoursAgo(t.hoursAgo),
}));

// Note: `templates` above intentionally covers every incident type defined
// in constants/incidentTypes.js at least twice, so category summaries have
// a realistic, non-empty spread across all known incident types.

// ─── Pure aggregation helpers ─────────────────────────────────────────────────

/** Incidents whose age is under 24h — same "reported today" definition
 *  Analyticspanel.jsx already uses for its "Last 24h" time-distribution
 *  bucket, kept consistent here rather than inventing a second definition. */
function isReportedToday(incident) {
  const DAY_MS = 24 * 60 * 60 * 1000;
  return Date.now() - new Date(incident.createdAt).getTime() < DAY_MS;
}

export function computeAdminStats(incidents = MOCK_ADMIN_INCIDENTS) {
  const byStatus = STATUS_VALUES.reduce((acc, s) => {
    acc[s] = 0;
    return acc;
  }, {});
  let today = 0;

  incidents.forEach((inc) => {
    if (byStatus[inc.status] !== undefined) byStatus[inc.status] += 1;
    if (isReportedToday(inc)) today += 1;
  });

  return {
    total: incidents.length,
    pending: byStatus.pending,
    underReview: byStatus.under_review,
    verified: byStatus.verified,
    resolved: byStatus.resolved,
    rejected: byStatus.rejected,
    reportedToday: today,
    statusBreakdown: STATUS_VALUES.map((status) => ({
      status,
      count: byStatus[status],
      percentage: incidents.length
        ? (byStatus[status] / incidents.length) * 100
        : 0,
    })),
    categoryBreakdown: computeCategoryBreakdown(incidents),
    trend: computeTrend(incidents),
  };
}

export function computeCategoryBreakdown(incidents = MOCK_ADMIN_INCIDENTS) {
  const byType = {};
  incidents.forEach((inc) => {
    byType[inc.type] = (byType[inc.type] ?? 0) + 1;
  });
  return Object.entries(byType)
    .sort(([, a], [, b]) => b - a)
    .map(([type, count]) => ({
      type,
      count,
      percentage: incidents.length ? (count / incidents.length) * 100 : 0,
    }));
}

/** Last 7 days (oldest → newest), incident count per day — basic trend
 *  data for a hand-rolled bar chart (no charting library). */
export function computeTrend(incidents = MOCK_ADMIN_INCIDENTS, days = 7) {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const buckets = Array.from({ length: days }, (_, i) => {
    const dayIndex = days - 1 - i; // i=0 -> oldest
    const date = new Date(Date.now() - dayIndex * DAY_MS);
    return {
      date,
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      count: 0,
    };
  });

  incidents.forEach((inc) => {
    const ageDays = Math.floor(
      (Date.now() - new Date(inc.createdAt).getTime()) / DAY_MS,
    );
    const bucketIndex = days - 1 - ageDays;
    if (bucketIndex >= 0 && bucketIndex < days) {
      buckets[bucketIndex].count += 1;
    }
  });

  return buckets.map(({ label, count }) => ({ label, count }));
}

export function getRecentIncidents(
  incidents = MOCK_ADMIN_INCIDENTS,
  limit = 6,
) {
  return [...incidents]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}
