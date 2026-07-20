/**
 * admin/data/adminUsersMock.js
 *
 * Realistic mock user roster for the admin User Management section
 * (Phase 5), plus PURE (no side effects, no async) helpers the same
 * shape as admin/data/adminMock.js's aggregation/filter functions.
 *
 * IMPORTANT — where the roster comes from: every incident in
 * admin/data/adminMock.js's MOCK_ADMIN_INCIDENTS already carries a
 * reporterId/reporterName. Rather than inventing a second, disconnected
 * list of "users" that could drift out of sync with who actually reported
 * what (the exact kind of duplication CLAUDE.md §10 and this codebase's
 * constants/incidentTypes.js header both warn about), this file builds
 * the base roster directly from those unique reporters. A handful of
 * additional accounts with zero reports are appended on top, so the
 * table/filters/empty-states have something to exercise for users who've
 * registered but never filed a report.
 *
 * A user's "number of reports" is intentionally NOT stored on the user
 * record. It's derived on demand via getUserReportCount()/getUserReports()
 * by counting MOCK_ADMIN_INCIDENTS entries for that reporterId — the same
 * "derive, don't duplicate" approach admin/constants/severity.js and
 * utils/dangerScore.js already use. This guarantees the count can never
 * go stale even after an admin edits/deletes incidents during the
 * session (see adminApi.js's mock-persistence note).
 */
import { MOCK_ADMIN_INCIDENTS } from "./adminMock";

const daysAgo = (d) =>
  new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();

function emailFor(name) {
  const local = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, ".");
  return `${local}@example.com`;
}

// Every unique reporter already seeded in the admin incidents mock —
// order-preserving, first occurrence wins (reporterId is unique per
// incident in adminMock.js's seed data, so this is effectively 1:1).
const reporterEntries = [];
const seenReporterIds = new Set();
MOCK_ADMIN_INCIDENTS.forEach((inc) => {
  if (seenReporterIds.has(inc.reporterId)) return;
  seenReporterIds.add(inc.reporterId);
  reporterEntries.push({ id: inc.reporterId, name: inc.reporterName });
});

// Registered accounts that haven't filed a report yet — exists purely to
// give the "0 reports" / empty-report-list paths something real to show.
const UNREPORTED_USERS = [
  { id: "user-101", name: "Imran Sheikh" },
  { id: "user-102", name: "Mahnoor Aziz" },
  { id: "user-103", name: "Rehan Qureshi" },
  { id: "user-104", name: "Sana Baig" },
];

const ROSTER = [...reporterEntries, ...UNREPORTED_USERS];

// Deterministic join dates (spread over roughly the last 14 months) and a
// deterministic "suspended" cycle (every 8th account) — repeatable across
// renders/reloads rather than random, matching adminMock.js's STATUS_CYCLE
// convention.
export const MOCK_ADMIN_USERS = ROSTER.map((u, i) => ({
  id: u.id,
  name: u.name,
  email: emailFor(u.name),
  joinedAt: daysAgo(20 + i * 16),
  status: i % 8 === 7 ? "suspended" : "active",
}));

// ─── Pure derived helpers ──────────────────────────────────────────────────

/** All incidents filed by a given user, newest first. */
export function getUserReports(userId, incidents = MOCK_ADMIN_INCIDENTS) {
  return incidents
    .filter((inc) => inc.reporterId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/** Report count for a given user — always derived, never stored. */
export function getUserReportCount(userId, incidents = MOCK_ADMIN_INCIDENTS) {
  return getUserReports(userId, incidents).length;
}

/** Default shape for User Management filters — mirrors
 *  adminMock.js's DEFAULT_INCIDENT_FILTERS convention. */
export const DEFAULT_USER_FILTERS = {
  search: "",
  status: "all",
};

/** Pure filter over users — search (name/email) + account status. Returns
 *  a new array; never mutates input. */
export function applyUserFilters(users = MOCK_ADMIN_USERS, filters = {}) {
  const { search, status } = { ...DEFAULT_USER_FILTERS, ...filters };
  const q = search.trim().toLowerCase();

  return users.filter((u) => {
    if (
      q &&
      !u.name.toLowerCase().includes(q) &&
      !u.email.toLowerCase().includes(q)
    ) {
      return false;
    }
    if (status !== "all" && u.status !== status) return false;
    return true;
  });
}

/** Newest-joined-first ordering — used as the default sort for the users
 *  table, same "recent first" convention as getRecentIncidents(). */
export function sortUsersByJoinDate(users = MOCK_ADMIN_USERS) {
  return [...users].sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt));
}
