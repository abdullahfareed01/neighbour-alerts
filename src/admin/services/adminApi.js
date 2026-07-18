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
} from "../data/adminMock";

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
// Phase 2 scope: dashboard-facing reads only (aggregate stats + a recent-
// incidents preview). Mutating endpoints (updateIncidentStatus, deleteIncident)
// and the full incident list/detail endpoints belong to the Incident
// Management phase and are intentionally not added yet.
//
// The aggregation itself lives in admin/data/adminMock.js as plain, pure
// functions — this file's only job is to simulate the network boundary
// (delay + { data } envelope) around them, exactly like incidentsAPI /
// authAPI do in services/api.js. When a real backend exists, only the
// bodies below change (to real HTTP calls); callers (AdminDashboard.jsx)
// don't need to change at all.
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
   * GET /api/admin/incidents?limit=&sort=recent
   * Returns incidents sorted newest-first. Used today only for the
   * dashboard's "Recent Incidents" preview (via `limit`); the full
   * filterable incident table is a later phase.
   *
   * PRODUCTION:
   *   getAdminIncidents: (params) => http.get("/admin/incidents", { params }),
   */
  getAdminIncidents: async ({ limit } = {}) => {
    await delay(400);
    const incidents = limit
      ? getRecentIncidents(MOCK_ADMIN_INCIDENTS, limit)
      : getRecentIncidents(MOCK_ADMIN_INCIDENTS, MOCK_ADMIN_INCIDENTS.length);
    return { data: { incidents, count: incidents.length } };
  },

  // Reserved for later phases (kept here only as a map of what's coming,
  // per CLAUDE.md §5 — not implemented yet):
  //   getAdminIncidentById(id)
  //   updateIncidentStatus(id, status)
  //   deleteIncident(id)
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