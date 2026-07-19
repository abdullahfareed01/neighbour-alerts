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

import {
  MOCK_ADMIN_INCIDENTS,
  computeAdminStats,
  getRecentIncidents,
  applyIncidentFilters,
} from "../data/adminMock";
import { STATUS_VALUES } from "../constants/incidentStatus";

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
const ADMIN_USER_KEY  = "na-admin-user";

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
    const sorted = getRecentIncidents(MOCK_ADMIN_INCIDENTS, MOCK_ADMIN_INCIDENTS.length);
    const filtered = applyIncidentFilters(sorted, filters);
    const totalCount = filtered.length;

    if (pageSize) {
      const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
      const safePage = Math.min(Math.max(1, page), totalPages);
      const start = (safePage - 1) * pageSize;
      const incidents = filtered.slice(start, start + pageSize);
      return {
        data: { incidents, count: totalCount, page: safePage, pageSize, totalPages },
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

  // Reserved for a later phase (kept here only as a map of what's coming,
  // per CLAUDE.md §5 — not implemented yet):
  //   getAdminUsers()
};

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