/**
 * admin/pages/AdminIncidentDetail.jsx
 *
 * Phase 3 — Incident Details.
 *
 * Fetches a single incident via adminApi.js and renders it read-only
 * alongside the same IncidentActions component used in the table's row
 * menu (here in its full "buttons" layout), plus StatusHistoryTimeline and
 * LocationSection — both already built in Phase 2/3 scaffolding and reused
 * as-is rather than duplicated.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, AlertTriangle, Calendar, Clock, User, Eye } from "lucide-react";

import StatusBadge from "../components/StatusBadge";
import SeverityBadge from "../components/SeverityBadge";
import LocationSection from "../components/LocationSection";
import StatusHistoryTimeline from "../components/StatusHistoryTimeline";
import IncidentActions from "../components/IncidentActions";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import Toast from "../components/Toast";

import { adminIncidentsAPI } from "../services/adminApi";
import { formatDateTime, timeAgo } from "../utils/formatDate";
import { TYPE_TAG_CLASS, TYPE_EMOJI } from "../../constants/incidentTypes";

function CategoryChip({ type }) {
  const cls =
    TYPE_TAG_CLASS[type] ??
    "bg-gray-50 dark:bg-na-hover text-gray-600 dark:text-slate-400 border-gray-200 dark:border-na-border";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${cls}`}>
      {TYPE_EMOJI[type] ?? "📍"} {type}
    </span>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={14} className="text-gray-400 dark:text-slate-500 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm font-medium text-gray-800 dark:text-slate-100 truncate">{value}</p>
      </div>
    </div>
  );
}

export default function AdminIncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [incident, setIncident] = useState(null);
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
    adminIncidentsAPI
      .getAdminIncidentById(id)
      .then(({ data }) => setIncident(data.incident))
      .catch((err) => setError(err?.message ?? "Failed to load this incident."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = useCallback(
    async (incidentId, status) => {
      try {
        const { data } = await adminIncidentsAPI.updateIncidentStatus(incidentId, status);
        setIncident(data.incident);
        showToast("Incident status updated.");
      } catch (err) {
        showToast(err?.message ?? "Failed to update status.", "error");
      }
    },
    [showToast],
  );

  const handleDelete = useCallback(
    async (incidentId) => {
      try {
        await adminIncidentsAPI.deleteIncident(incidentId);
        showToast("Incident deleted.");
        setTimeout(() => navigate("/admin/incidents", { replace: true }), 650);
      } catch (err) {
        showToast(err?.message ?? "Failed to delete incident.", "error");
      }
    },
    [navigate, showToast],
  );

  const backButton = (
    <button
      onClick={() => navigate("/admin/incidents")}
      className="flex items-center gap-1.5 text-xs font-semibold
        text-gray-500 dark:text-slate-400
        hover:text-blue-600 dark:hover:text-blue-400
        hover:bg-blue-50 dark:hover:bg-blue-900/25
        px-2 py-1.5 -ml-2 rounded-lg transition-colors"
    >
      <ArrowLeft size={13} />
      Back to Incidents
    </button>
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {backButton}
        <LoadingState label="Loading incident…" />
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="space-y-3">
        {backButton}
        <div className="bg-white dark:bg-na-surface rounded-2xl border border-gray-100 dark:border-na-border shadow-sm">
          <EmptyState
            icon={AlertTriangle}
            title="Incident not found"
            description={error ?? `No incident found with ID "${id}".`}
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
        <div className="min-w-0">
          <p className="text-[11px] font-mono text-gray-400 dark:text-slate-500 mb-1">{incident.id}</p>
          <h1 className="text-lg font-bold text-gray-900 dark:text-slate-100 leading-snug">
            {incident.title}
          </h1>
          <div className="flex items-center gap-2 flex-wrap mt-2">
            <StatusBadge status={incident.status} />
            <SeverityBadge type={incident.type} />
            <CategoryChip type={incident.type} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Left / main column ────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-na-surface rounded-2xl p-4 border border-gray-100 dark:border-na-border shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 mb-3">
              Incident Details
            </h3>

            <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              {incident.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailRow
                icon={Calendar}
                label="Reported"
                value={`${formatDateTime(incident.createdAt)} (${timeAgo(incident.createdAt)})`}
              />
              <DetailRow icon={User} label="Reporter" value={incident.reporterName ?? "Anonymous"} />
              <DetailRow icon={Eye} label="Views" value={incident.views ?? 0} />
              <DetailRow icon={Clock} label="Reporter ID" value={incident.reporterId} />
            </div>
          </div>

          <LocationSection incident={incident} />

          <div className="bg-white dark:bg-na-surface rounded-2xl p-4 border border-gray-100 dark:border-na-border shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 mb-3">
              Status History
            </h3>
            <StatusHistoryTimeline history={incident.statusHistory ?? []} />
          </div>
        </div>

        {/* ── Right column — admin actions ─────────────────────────────── */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-na-surface rounded-2xl p-4 border border-gray-100 dark:border-na-border shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 mb-3">
              Admin Actions
            </h3>
            <IncidentActions
              incident={incident}
              layout="buttons"
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              allowDelete
            />
          </div>
        </div>
      </div>
    </div>
  );
}
