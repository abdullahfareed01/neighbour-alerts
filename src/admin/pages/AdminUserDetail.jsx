/**
 * admin/pages/AdminUserDetail.jsx
 *
 * Phase 5 — User Management: user detail view.
 *
 * Fetches a single user (+ the incidents they've reported) via
 * adminApi.js and renders it read-only alongside UserActions (here in
 * its full "buttons" layout) — the same structural split
 * AdminIncidentDetail.jsx already established for incidents.
 *
 * The "reports by this user" list reuses admin/components/RecentIncidents
 * as-is rather than building a second incident-list component: it already
 * renders exactly what's needed here (type emoji, title, reporter/time,
 * views, incident StatusBadge) and this page just feeds it the user's own
 * reports instead of the dashboard's global recent list.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  AlertTriangle,
  Calendar,
  Mail,
  FileText,
} from "lucide-react";

import UserStatusBadge from "../components/UserStatusBadge";
import UserActions from "../components/UserActions";
import RecentIncidents from "../components/RecentIncidents";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import Toast from "../components/Toast";

import { adminUsersAPI } from "../services/adminApi";
import { formatDateTime, timeAgo } from "../utils/formatDate";

function DetailRow({ icon, label, value }) {
  if (value == null || value === "") return null;
  const Icon = icon;
  return (
    <div className="flex items-start gap-2.5">
      <Icon
        size={14}
        className="text-gray-400 dark:text-slate-500 shrink-0 mt-0.5"
      />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm font-medium text-gray-800 dark:text-slate-100 truncate">
          {value}
        </p>
      </div>
    </div>
  );
}

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((message, type = "success") => {
    clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);
  useEffect(() => () => clearTimeout(toastTimerRef.current), []);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    adminUsersAPI
      .getAdminUserById(id)
      .then(({ data }) => {
        setUser(data.user);
        setReports(data.reports);
      })
      .catch((err) => setError(err?.message ?? "Failed to load this user."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    // Defer calling load to avoid synchronous setState within the effect
    const t = setTimeout(() => load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const handleSuspend = useCallback(
    async (userId) => {
      try {
        const { data } = await adminUsersAPI.suspendUser(userId);
        setUser(data.user);
        showToast("Account suspended.");
      } catch (err) {
        showToast(err?.message ?? "Failed to suspend account.", "error");
      }
    },
    [showToast],
  );

  const handleRestore = useCallback(
    async (userId) => {
      try {
        const { data } = await adminUsersAPI.restoreUser(userId);
        setUser(data.user);
        showToast("Account restored.");
      } catch (err) {
        showToast(err?.message ?? "Failed to restore account.", "error");
      }
    },
    [showToast],
  );

  const backButton = (
    <button
      onClick={() => navigate("/admin/users")}
      className="flex items-center gap-1.5 text-xs font-semibold
        text-gray-500 dark:text-slate-400
        hover:text-blue-600 dark:hover:text-blue-400
        hover:bg-blue-50 dark:hover:bg-blue-900/25
        px-2 py-1.5 -ml-2 rounded-lg transition-colors"
    >
      <ArrowLeft size={13} />
      Back to Users
    </button>
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {backButton}
        <LoadingState label="Loading user…" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-3">
        {backButton}
        <div className="bg-white dark:bg-na-surface rounded-2xl border border-gray-100 dark:border-na-border shadow-sm">
          <EmptyState
            icon={AlertTriangle}
            title="User not found"
            description={error ?? `No user found with ID "${id}".`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Toast toast={toast} />

      {backButton}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-white flex items-center justify-center text-xl font-bold shadow-md shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-mono text-gray-400 dark:text-slate-500 mb-1">
              {user.id}
            </p>
            <h1 className="text-lg font-bold text-gray-900 dark:text-slate-100 leading-snug truncate">
              {user.name}
            </h1>
            <div className="flex items-center gap-2 flex-wrap mt-2">
              <UserStatusBadge status={user.status} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Left / main column ────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-na-surface rounded-2xl p-4 border border-gray-100 dark:border-na-border shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 mb-3">
              Account Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailRow icon={Mail} label="Email" value={user.email} />
              <DetailRow
                icon={Calendar}
                label="Joined"
                value={`${formatDateTime(user.joinedAt)} (${timeAgo(user.joinedAt)})`}
              />
              <DetailRow
                icon={FileText}
                label="Reports filed"
                value={user.reportsCount ?? 0}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-na-surface rounded-2xl p-4 border border-gray-100 dark:border-na-border shadow-sm">
            <RecentIncidents incidents={reports} title="Reports by this User" />
          </div>
        </div>

        {/* ── Right column — admin actions ─────────────────────────────── */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-na-surface rounded-2xl p-4 border border-gray-100 dark:border-na-border shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 mb-3">
              Admin Actions
            </h3>
            <UserActions
              user={user}
              layout="buttons"
              onSuspend={handleSuspend}
              onRestore={handleRestore}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
