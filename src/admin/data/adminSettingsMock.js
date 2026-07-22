/**
 * admin/data/adminSettingsMock.js
 *
 * Phase 7 — Settings.
 *
 * Mirrors the plain-pure-functions-over-a-module-level-object convention
 * already used by adminMock.js / adminUsersMock.js: no fetching, no
 * adminApi.js-specific concerns, just data + pure helpers. adminApi.js
 * wraps this in the usual simulated network delay + { data } envelope.
 *
 * MOCK PERSISTENCE NOTE: like MOCK_ADMIN_INCIDENTS / MOCK_ADMIN_USERS,
 * this is a module-level object, so changes persist for the lifetime of
 * the browser session/tab and reset on a full page reload.
 */

export const DEFAULT_ADMIN_SETTINGS = {
  notifyNewIncidents: true,
  notifyUserReports: true,
  weeklySummaryEmail: false,
};

// Module-level mutable store — same pattern as MOCK_ADMIN_INCIDENTS/USERS.
export const MOCK_ADMIN_SETTINGS = { ...DEFAULT_ADMIN_SETTINGS };

/** Returns a shallow copy so callers never mutate the store directly. */
export function getSettings() {
  return { ...MOCK_ADMIN_SETTINGS };
}

/** Merges a patch into the store and returns the resulting copy. */
export function applySettingsPatch(patch = {}) {
  Object.assign(MOCK_ADMIN_SETTINGS, patch);
  return getSettings();
}
