/**
 * services/api.js
 *
 * API abstraction layer. All components and pages use ONLY these functions.
 * To go live: swap the simulated responses with real axios calls.
 *
 * Backend shape contract:
 *   Incident: { id, title, description, type, lat, lng, createdAt, userId, userName }
 *   User:     { id, name, email, createdAt }
 */

// ─── When backend is ready, uncomment this block ─────────────────────────────
// import axios from "axios";
// const http = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api" });
// http.interceptors.request.use((cfg) => {
//   const token = localStorage.getItem("token");
//   if (token) cfg.headers.Authorization = `Bearer ${token}`;
//   return cfg;
// });
// http.interceptors.response.use(
//   (res) => res,
//   (err) => {
//     if (err.response?.status === 401) {
//       localStorage.removeItem("token");
//       localStorage.removeItem("user");
//       window.location.href = "/";
//     }
//     return Promise.reject(err);
//   }
// );

// ─── Simulated delay (mimics real network latency) ───────────────────────────
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

// ─── Incidents API ────────────────────────────────────────────────────────────
export const incidentsAPI = {
  /**
   * GET /api/incidents/nearby?lat=&lng=&radius=
   * Returns incidents within radius metres of the given point.
   *
   * PRODUCTION:
   *   return http.get("/incidents/nearby", { params: { lat, lng, radius } });
   */
  getNearby: async (lat, lng, radius = 5000) => {
    await delay(400);
    // Simulation: import and return seed data shaped like a real response
    const { incidents } = await import("../data/incidents");
    return { data: { incidents, count: incidents.length } };
  },

  /**
   * POST /api/incidents
   * Creates a new incident. Returns the created document.
   *
   * PRODUCTION:
   *   return http.post("/incidents", payload);
   */
  create: async (payload) => {
    await delay(350);
    const incident = {
      id:          `local-${Date.now()}`,
      title:       payload.title,
      description: payload.description,
      type:        payload.type,
      lat:         payload.lat,
      lng:         payload.lng,
      userId:      payload.userId  ?? "local-user",
      userName:    payload.userName ?? "You",
      createdAt:   new Date().toISOString(),
    };
    return { data: { incident } };
  },

  /**
   * GET /api/incidents/user/:userId
   * Returns all incidents for a given user.
   *
   * PRODUCTION:
   *   return http.get(`/incidents/user/${userId}`);
   */
  getUserIncidents: async (userId) => {
    await delay(300);
    const { incidents } = await import("../data/incidents");
    const filtered = incidents.filter((i) => i.userId === userId);
    return { data: { incidents: filtered } };
  },
};

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authAPI = {
  /**
   * PRODUCTION:
   *   login:    (data) => http.post("/auth/login", data),
   *   register: (data) => http.post("/auth/register", data),
   *   me:       ()     => http.get("/auth/me"),
   */
  login: async (email, password) => {
    await delay(500);
    return {
      data: {
        token: "mock-jwt-token",
        user:  { id: "local-user", name: "Ali Khan", email },
      },
    };
  },
  register: async (name, email, password) => {
    await delay(500);
    return {
      data: {
        token: "mock-jwt-token",
        user:  { id: "local-user", name, email },
      },
    };
  },
  me: async () => {
    await delay(200);
    return {
      data: {
        user: { id: "local-user", name: "Ali Khan", email: "ali@example.com", createdAt: "2024-01-01" },
      },
    };
  },
};


//        AUTH HELPER
//
// Thin localStorage read/write layer. AuthContext is the single source of
// truth for auth *state* in the app — these helpers just persist/restore
// that state across reloads. Components should call useAuth(), not these,
// directly (Sidebar/Dashboard/UserProfile used to reach in here directly,
// which is what caused the auth desync bug).

export const authHelpers = {
  login: (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  getToken: () => {
    return localStorage.getItem("token");
  },

  isLoggedIn: () => {
    return !!localStorage.getItem("token");
  },
};