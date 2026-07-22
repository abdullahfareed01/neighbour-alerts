/**
 * admin/pages/AdminSettings.jsx
 *
 * Phase 7 — Settings.
 *
 * Owns settings state (notification prefs, password form, toast) and is
 * the only thing that talks to adminApi.js for this page, same split
 * every other admin page uses. Appearance/theme is NOT duplicated here —
 * it reads/toggles the existing global ThemeContext directly, since that
 * context is already the single source of truth for dark mode.
 */
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  User,
  Bell,
  Lock,
  Palette,
  Loader2,
} from "lucide-react";

import AnalyticsCard from "../components/AnalyticsCard";
import ToggleSwitch from "../components/ToggleSwitch";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import Toast from "../components/Toast";

import { adminSettingsAPI } from "../services/adminApi";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useTheme } from "../../context/ThemeContext";

const NOTIF_ROWS = [
  {
    key: "notifyNewIncidents",
    label: "New incident reports",
    description: "Notify me when a new incident is submitted.",
  },
  {
    key: "notifyUserReports",
    label: "User account changes",
    description: "Notify me when a user is suspended or restored.",
  },
  {
    key: "weeklySummaryEmail",
    label: "Weekly summary email",
    description: "Send a weekly digest of incident activity.",
  },
];

export default function AdminSettings() {
  const { admin } = useAdminAuth();
  const { dark, toggle } = useTheme();

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingKey, setSavingKey] = useState(null);

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    adminSettingsAPI
      .getAdminSettings()
      .then(({ data }) => setSettings(data.settings))
      .catch(() => setError("Failed to load settings. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggle = useCallback(
    async (key, value) => {
      setSavingKey(key);
      const prev = settings;
      setSettings((s) => ({ ...s, [key]: value }));
      try {
        const { data } = await adminSettingsAPI.updateAdminSettings({
          [key]: value,
        });
        setSettings(data.settings);
      } catch (err) {
        setSettings(prev);
        showToast(err?.message ?? "Failed to update setting.", "error");
      } finally {
        setSavingKey(null);
      }
    },
    [settings, showToast],
  );

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwError("");

    if (!pwForm.current || !pwForm.next || !pwForm.confirm) {
      setPwError("Please fill in all password fields.");
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwError("New password and confirmation do not match.");
      return;
    }

    setPwSaving(true);
    try {
      await adminSettingsAPI.changePassword(pwForm.current, pwForm.next);
      setPwForm({ current: "", next: "", confirm: "" });
      showToast("Password updated.");
    } catch (err) {
      setPwError(err?.message ?? "Failed to update password.");
    } finally {
      setPwSaving(false);
    }
  };

  if (loading) return <LoadingState label="Loading settings…" />;

  if (error || !settings) {
    return (
      <div className="bg-white dark:bg-na-surface rounded-2xl border border-gray-100 dark:border-na-border shadow-sm">
        <EmptyState
          icon={AlertTriangle}
          title="Couldn't load settings"
          description={error}
        />
        <div className="pb-6 flex justify-center">
          <button
            onClick={load}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/25 px-3 py-1.5 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Toast toast={toast} />

      {/* Profile */}
      <AnalyticsCard title="Admin Profile" icon={User}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
            {(admin?.name ?? "A").charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 truncate">
              {admin?.name ?? "Admin"}
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-500 truncate">
              {admin?.email}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-slate-500 mt-0.5">
              {admin?.role?.replace("_", " ") ?? "admin"}
            </p>
          </div>
        </div>
      </AnalyticsCard>

      {/* Notifications */}
      <AnalyticsCard title="Notification Preferences" icon={Bell}>
        <div className="divide-y divide-gray-100 dark:divide-na-border">
          {NOTIF_ROWS.map((row) => (
            <div
              key={row.key}
              className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-slate-100">
                  {row.label}
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                  {row.description}
                </p>
              </div>
              <ToggleSwitch
                checked={!!settings[row.key]}
                disabled={savingKey === row.key}
                onChange={(val) => handleToggle(row.key, val)}
                label={row.label}
              />
            </div>
          ))}
        </div>
      </AnalyticsCard>

      {/* Appearance */}
      <AnalyticsCard title="Appearance" icon={Palette}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-slate-100">
              Dark mode
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
              Applies across the whole admin console.
            </p>
          </div>
          <ToggleSwitch checked={dark} onChange={toggle} label="Dark mode" />
        </div>
      </AnalyticsCard>

      {/* Change password */}
      <AnalyticsCard title="Change Password" icon={Lock}>
        <form onSubmit={handlePasswordSubmit} className="space-y-3 max-w-sm">
          {["current", "next", "confirm"].map((field) => (
            <input
              key={field}
              type="password"
              value={pwForm[field]}
              onChange={(e) =>
                setPwForm((p) => ({ ...p, [field]: e.target.value }))
              }
              placeholder={
                field === "current"
                  ? "Current password"
                  : field === "next"
                    ? "New password"
                    : "Confirm new password"
              }
              autoComplete={
                field === "current" ? "current-password" : "new-password"
              }
              disabled={pwSaving}
              className="w-full px-3 py-2 rounded-lg text-sm border
                bg-gray-50 dark:bg-na-input text-gray-700 dark:text-slate-200
                border-gray-200 dark:border-na-border
                focus:outline-none focus:border-blue-400 dark:focus:border-na-border
                disabled:opacity-60"
            />
          ))}

          {pwError && (
            <p className="text-xs text-red-500 dark:text-red-400">{pwError}</p>
          )}

          <button
            type="submit"
            disabled={pwSaving}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700
              hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold
              px-4 py-2 rounded-xl disabled:opacity-60 active:scale-[.98] transition-all"
          >
            {pwSaving && <Loader2 size={14} className="animate-spin" />}
            Update Password
          </button>
        </form>
      </AnalyticsCard>
    </div>
  );
}
