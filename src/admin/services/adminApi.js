/**
 * admin/services/adminApi.js
 *
 * Mock admin API layer — mirrors the shape/conventions of services/api.js
 * (simulated network delay, { data: {...} } response envelope, a real-axios
 * version commented above each function) so this can be swapped for real
 * backend calls later without rewriting AdminAuthContext or any admin page.
 *
 * IMPORTANT: This is a frontend-only mock for development. There is no
 * real authentication, hashing, or token verification happening here.
 *
 * Admin session storage is intentionally kept SEPARATE from the normal
 * user session (services/api.js's authHelpers / AuthContext) via distinct
 * localStorage keys, so an admin session and a regular user session can
 * coexist in the same browser without colliding or overwriting each other.
 */
import { getSettings, applySettingsPatch } from "../data/adminSettingsMock";

import {
  MOCK_ADMIN_INCIDENTS,
  computeAdminStats,
  getRecentIncidents,
  applyIncidentFilters,
} from "../data/adminMock";
import {
  MOCK_ADMIN_USERS,
  applyUserFilters,
  sortUsersByJoinDate,
  getUserReports,
  getUserReportCount,
} from "../data/adminUsersMock";
import { STATUS_VALUES } from "../constants/incidentStatus";
import { USER_STATUS_VALUES } from "../constants/userStatus";
import { computeAdminAnalytics } from "../data/adminAnalyticsMock";

const delay = (ms = 450) => new Promise((r) => setTimeout(r, ms));

// ─── Mock admin account ───────────────────────────────────────────────────────
// Dev-only credentials. Replace with real backend authentication before
// this ever ships — see CLAUDE.md §8 (future shared backend + role-based
// authorization).
const MOCK_ADMIN_CREDENTIALS = {
  email: "admin@neighbouralerts.com",
  password: "admin123",
};

const MOCK_ADMIN = {
  id: "admin-001",
  name: "Admin User",
  email: MOCK_ADMIN_CREDENTIALS.email,
  role: "super_admin",
};

// ─── Admin Auth API ───────────────────────────────────────────────────────────
export const adminAuthAPI = {
  /**
   * PRODUCTION:
   *   login: (data) => http.post("/admin/auth/login", data),
   */
  login: async (email, password) => {
    await delay(500);

    const normalizedEmail = (email ?? "").trim().toLowerCase();
    const validEmail = normalizedEmail === MOCK_ADMIN_CREDENTIALS.email;
    const validPassword = password === MOCK_ADMIN_CREDENTIALS.password;

    if (!validEmail || !validPassword) {
      const err = new Error("Invalid admin email or password.");
      err.code = "INVALID_ADMIN_CREDENTIALS";
      throw err;
    }

    return {
      data: {
        token: "mock-admin-jwt-token",
        admin: MOCK_ADMIN,
      },
    };
  },
};

// ─── Admin session helpers (localStorage) ─────────────────────────────────────
// Separate keys from the user session (`token` / `user`) so the two never
// collide. AdminAuthContext is the single source of truth for admin auth
// *state*; these are just the persistence layer underneath it.
const ADMIN_TOKEN_KEY = "na-admin-token";
const ADMIN_USER_KEY = "na-admin-user";

// ─── Admin Incidents API ──────────────────────────────────────────────────────
// Phase 2 added dashboard-facing reads (aggregate stats + a recent-
// incidents preview). Phase 3 (Incident Management) adds: a filterable +
// paginated incident list, single-incident lookup, and the mutating
// endpoints (status changes, delete) used by IncidentActions.jsx.
//
// The aggregation/filtering itself lives in admin/data/adminMock.js as
// plain, pure functions — this file's only job is to simulate the network
// boundary (delay + { data } envelope, throwing on "not found") around
// them, exactly like incidentsAPI/authAPI do in services/api.js. When a
// real backend exists, only the bodies below change (to real HTTP calls);
// callers (AdminDashboard.jsx, AdminIncidents.jsx, AdminIncidentDetail.jsx)
// don't need to change at all.
//
// MOCK PERSISTENCE NOTE: MOCK_ADMIN_INCIDENTS is a module-level array, so
// mutations below (status changes, deletes) persist for the lifetime of
// the browser session/tab and are immediately visible to every other
// admin page (e.g. the Overview Dashboard's stats) since they all read
// from this same array. A full page reload resets everything back to the
// seed data in adminMock.js — expected for a frontend-only mock phase.
function findIncidentOrThrow(id) {
  const incident = MOCK_ADMIN_INCIDENTS.find((i) => i.id === id);
  if (!incident) {
    const err = new Error(`No incident found with ID "${id}".`);
    err.code = "INCIDENT_NOT_FOUND";
    throw err;
  }
  return incident;
}

export const adminIncidentsAPI = {
  /**
   * GET /api/admin/stats
   * Returns aggregate incident counts (total/pending/under review/
   * verified/resolved/rejected/reported today), a status breakdown, a
   * category breakdown, and a 7-day trend — everything the Overview
   * Dashboard needs in a single call.
   *
   * PRODUCTION:
   *   getAdminStats: () => http.get("/admin/stats"),
   */
  getAdminStats: async () => {
    await delay(400);
    return { data: { stats: computeAdminStats(MOCK_ADMIN_INCIDENTS) } };
  },

  /**
   * GET /api/admin/incidents?limit=&sort=recent            (dashboard preview)
   * GET /api/admin/incidents?filters=&page=&pageSize=       (management table)
   *
   * Two call shapes on purpose, kept backward-compatible:
   *  - `{ limit }` (AdminDashboard.jsx's "Recent Incidents" preview): same
   *    behavior as Phase 2 — newest-first, sliced to `limit`, unfiltered.
   *  - `{ filters, page, pageSize }` (AdminIncidents.jsx's management
   *    table): sorted newest-first, filtered via applyIncidentFilters,
   *    then paginated. Returns page/pageSize/totalPages alongside the
   *    total (pre-pagination, post-filter) `count`.
   *
   * PRODUCTION:
   *   getAdminIncidents: (params) => http.get("/admin/incidents", { params }),
   */
  getAdminIncidents: async ({ limit, filters, page = 1, pageSize } = {}) => {
    await delay(400);

    // Dashboard preview path — unchanged from Phase 2.
    if (limit && !filters && !pageSize) {
      const incidents = getRecentIncidents(MOCK_ADMIN_INCIDENTS, limit);
      return { data: { incidents, count: incidents.length } };
    }

    // Incident Management table path — filter, then paginate.
    const sorted = getRecentIncidents(
      MOCK_ADMIN_INCIDENTS,
      MOCK_ADMIN_INCIDENTS.length,
    );
    const filtered = applyIncidentFilters(sorted, filters);
    const totalCount = filtered.length;

    if (pageSize) {
      const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
      const safePage = Math.min(Math.max(1, page), totalPages);
      const start = (safePage - 1) * pageSize;
      const incidents = filtered.slice(start, start + pageSize);
      return {
        data: {
          incidents,
          count: totalCount,
          page: safePage,
          pageSize,
          totalPages,
        },
      };
    }

    return { data: { incidents: filtered, count: totalCount } };
  },

  /**
   * GET /api/admin/incidents/:id
   * Full single-incident record (used by AdminIncidentDetail.jsx) —
   * includes statusHistory, reporter info, and coordinates.
   *
   * PRODUCTION:
   *   getAdminIncidentById: (id) => http.get(`/admin/incidents/${id}`),
   */
  getAdminIncidentById: async (id) => {
    await delay(350);
    const incident = findIncidentOrThrow(id);
    return { data: { incident } };
  },

  /**
   * PATCH /api/admin/incidents/:id/status
   * Updates an incident's status and appends an entry to its
   * statusHistory (mirrors the shape seeded by adminMock's
   * buildStatusHistory, so timeline entries look consistent whether
   * they were seeded or created live).
   *
   * PRODUCTION:
   *   updateIncidentStatus: (id, status, note) =>
   *     http.patch(`/admin/incidents/${id}/status`, { status, note }),
   */
  updateIncidentStatus: async (id, status, note) => {
    await delay(450);
    const incident = findIncidentOrThrow(id);

    if (!STATUS_VALUES.includes(status)) {
      const err = new Error(`"${status}" is not a valid incident status.`);
      err.code = "INVALID_STATUS";
      throw err;
    }

    incident.status = status;
    incident.statusHistory = [
      ...(incident.statusHistory ?? []),
      {
        status,
        at: new Date().toISOString(),
        by: MOCK_ADMIN.name,
        note,
      },
    ];

    return { data: { incident } };
  },

  /**
   * DELETE /api/admin/incidents/:id
   * Permanently removes an incident from the mock store.
   *
   * PRODUCTION:
   *   deleteIncident: (id) => http.delete(`/admin/incidents/${id}`),
   */
  deleteIncident: async (id) => {
    await delay(400);
    const index = MOCK_ADMIN_INCIDENTS.findIndex((i) => i.id === id);
    if (index === -1) {
      const err = new Error(`No incident found with ID "${id}".`);
      err.code = "INCIDENT_NOT_FOUND";
      throw err;
    }
    const [removed] = MOCK_ADMIN_INCIDENTS.splice(index, 1);
    return { data: { deleted: true, id: removed.id } };
  },
};

// ─── Admin Users API ──────────────────────────────────────────────────────────
// Phase 5 (User Management). Same conventions as adminIncidentsAPI above:
// simulated network delay + { data } envelope, a findOrThrow guard, and a
// PRODUCTION comment over every function showing the real-backend
// equivalent. The roster + filtering/derivation logic itself lives in
// admin/data/adminUsersMock.js as plain pure functions — this file's only
// job is the network-boundary simulation around them.
//
// MOCK PERSISTENCE NOTE: MOCK_ADMIN_USERS is a module-level array, same as
// MOCK_ADMIN_INCIDENTS — suspend/restore mutations persist for the
// lifetime of the browser session/tab and are immediately visible
// everywhere (list, detail page), and reset on a full page reload.
//
// "Number of reports" is deliberately computed here (via
// getUserReportCount/getUserReports against MOCK_ADMIN_INCIDENTS) rather
// than read off a stored field — see adminUsersMock.js's header for why.
function findUserOrThrow(id) {
  const user = MOCK_ADMIN_USERS.find((u) => u.id === id);
  if (!user) {
    const err = new Error(`No user found with ID "${id}".`);
    err.code = "USER_NOT_FOUND";
    throw err;
  }
  return user;
}

function withReportCount(user) {
  return {
    ...user,
    reportsCount: getUserReportCount(user.id, MOCK_ADMIN_INCIDENTS),
  };
}

export const adminUsersAPI = {
  /**
   * GET /api/admin/users?filters=&page=&pageSize=
   * Filtered (search + status) + paginated user list for the User
   * Management table. Sorted newest-joined-first by default. Each user
   * comes back with a live `reportsCount` attached.
   *
   * PRODUCTION:
   *   getAdminUsers: (params) => http.get("/admin/users", { params }),
   */
  getAdminUsers: async ({ filters, page = 1, pageSize = 10 } = {}) => {
    await delay(400);

    const sorted = sortUsersByJoinDate(MOCK_ADMIN_USERS);
    const filtered = applyUserFilters(sorted, filters).map(withReportCount);
    const totalCount = filtered.length;

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    const users = filtered.slice(start, start + pageSize);

    return {
      data: { users, count: totalCount, page: safePage, pageSize, totalPages },
    };
  },

  /**
   * GET /api/admin/users/:id
   * Full single-user record (used by AdminUserDetail.jsx) plus the list
   * of incidents they've reported, newest first.
   *
   * PRODUCTION:
   *   getAdminUserById: (id) => http.get(`/admin/users/${id}`),
   */
  getAdminUserById: async (id) => {
    await delay(350);
    const user = findUserOrThrow(id);
    return {
      data: {
        user: withReportCount(user),
        reports: getUserReports(id, MOCK_ADMIN_INCIDENTS),
      },
    };
  },

  /**
   * PATCH /api/admin/users/:id/status  { status: "suspended" }
   * Suspends a user account. Frontend-only mock — no session revocation,
   * no real access control; just flips the mock status field.
   *
   * PRODUCTION:
   *   suspendUser: (id) => http.patch(`/admin/users/${id}/status`, { status: "suspended" }),
   */
  suspendUser: async (id) => {
    await delay(400);
    const user = findUserOrThrow(id);
    user.status = "suspended";
    return { data: { user: withReportCount(user) } };
  },

  /**
   * PATCH /api/admin/users/:id/status  { status: "active" }
   * Restores a previously suspended user account back to active.
   *
   * PRODUCTION:
   *   restoreUser: (id) => http.patch(`/admin/users/${id}/status`, { status: "active" }),
   */
  restoreUser: async (id) => {
    await delay(400);
    const user = findUserOrThrow(id);
    if (!USER_STATUS_VALUES.includes("active")) {
      // Defensive guard only — "active" is always a valid value in
      // constants/userStatus.js; this just keeps the same validation
      // shape as updateIncidentStatus above in case that ever changes.
      const err = new Error(`"active" is not a valid user status.`);
      err.code = "INVALID_STATUS";
      throw err;
    }
    user.status = "active";
    return { data: { user: withReportCount(user) } };
  },
};

// ─── Admin Analytics API ───────────────────────────────────────────────────────
// Phase 6 (Admin Analytics). Single read endpoint — the aggregation logic
// itself lives in admin/data/adminAnalyticsMock.js as plain pure functions
// (same "data file owns computation, this file only simulates the network
// boundary" convention as adminIncidentsAPI/adminUsersAPI above). Reads
// live off the same module-level MOCK_ADMIN_INCIDENTS / MOCK_ADMIN_USERS
// arrays used everywhere else, so Analytics always reflects any
// in-session status changes, suspensions, or deletions an admin has made
// elsewhere — no separate analytics dataset to fall out of sync.
export const adminAnalyticsAPI = {
  /**
   * GET /api/admin/analytics
   * Returns incidents-over-time, category/severity/status breakdowns,
   * most-affected areas, resolution statistics, and user reporting
   * activity in a single payload.
   *
   * PRODUCTION:
   *   getAdminAnalytics: () => http.get("/admin/analytics"),
   */
  getAdminAnalytics: async () => {
    await delay(450);
    return {
      data: {
        analytics: computeAdminAnalytics({
          incidents: MOCK_ADMIN_INCIDENTS,
          users: MOCK_ADMIN_USERS,
        }),
      },
    };
  },
};

// ─── Admin Settings API ────────────────────────────────────────────────────
// Phase 7 (Settings). Same conventions as every other admin endpoint above:
// simulated network delay + { data } envelope. Notification preferences
// live in adminSettingsMock.js as a plain mutable store; "change password"
// reuses the existing MOCK_ADMIN_CREDENTIALS/MOCK_ADMIN already defined at
// the top of this file rather than inventing a second admin identity.
export const adminSettingsAPI = {
  /**
   * GET /api/admin/settings
   * PRODUCTION:
   *   getAdminSettings: () => http.get("/admin/settings"),
   */
  getAdminSettings: async () => {
    await delay(300);
    return { data: { settings: getSettings(), admin: MOCK_ADMIN } };
  },

  /**
   * PATCH /api/admin/settings
   * PRODUCTION:
   *   updateAdminSettings: (patch) => http.patch("/admin/settings", patch),
   */
  updateAdminSettings: async (patch) => {
    await delay(350);
    return { data: { settings: applySettingsPatch(patch) } };
  },

  /**
   * POST /api/admin/settings/change-password
   * Mock-validates the current password against MOCK_ADMIN_CREDENTIALS and,
   * if correct, updates it in place for the rest of the session.
   *
   * PRODUCTION:
   *   changePassword: (currentPassword, newPassword) =>
   *     http.post("/admin/settings/change-password", { currentPassword, newPassword }),
   */
  changePassword: async (currentPassword, newPassword) => {
    await delay(450);
    if (currentPassword !== MOCK_ADMIN_CREDENTIALS.password) {
      const err = new Error("Current password is incorrect.");
      err.code = "INVALID_CURRENT_PASSWORD";
      throw err;
    }
    if (!newPassword || newPassword.length < 6) {
      const err = new Error("New password must be at least 6 characters.");
      err.code = "INVALID_NEW_PASSWORD";
      throw err;
    }
    MOCK_ADMIN_CREDENTIALS.password = newPassword;
    return { data: { success: true } };
  },
};

// ─── Admin Settings ────────────────────────────────────────────────────────────
// Phase 7 (Admin Settings). No backend yet, so preferences persist to
// localStorage under their own key (separate from the admin session and
// theme keys) — the same lightweight persistence approach
// ThemeContext.jsx already uses for dark/light mode. Swapping in a real
// backend later only means changing the two function bodies below.
const ADMIN_SETTINGS_KEY = "na-admin-settings";

const DEFAULT_ADMIN_SETTINGS = {
  notifyNewIncident: true,
  notifyStatusChange: false,
  weeklySummary: true,
};

function readStoredSettings() {
  try {
    const raw = localStorage.getItem(ADMIN_SETTINGS_KEY);
    return raw
      ? { ...DEFAULT_ADMIN_SETTINGS, ...JSON.parse(raw) }
      : { ...DEFAULT_ADMIN_SETTINGS };
  } catch (_) {
    return { ...DEFAULT_ADMIN_SETTINGS };
  }
}

function writeStoredSettings(settings) {
  try {
    localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(settings));
  } catch (_) {
    // Ignore write failures (e.g. private-browsing storage limits) —
    // preferences just won't persist across reloads in that case.
  }
}

export const adminAuthHelpers = {
  login: (token, admin) => {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(admin));
  },

  logout: () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
  },

  getAdmin: () => {
    const admin = localStorage.getItem(ADMIN_USER_KEY);
    return admin ? JSON.parse(admin) : null;
  },

  getToken: () => localStorage.getItem(ADMIN_TOKEN_KEY),
};
