/**
 * admin/pages/AdminIncidents.jsx
 *
 * Phase 3 — Incident Management.
 *
 * Owns all Incident Management state (filters, pagination, loading/error,
 * toast) and is the only thing that talks to adminApi.js for this page —
 * IncidentFilters/IncidentTable/IncidentActions stay "dumb" presentational
 * components exactly as documented in their own file headers.
 *
 * Search is debounced here (not inside IncidentFilters, per that
 * component's own header comment) so free-text typing doesn't fire a
 * request per keystroke; every other filter change refetches immediately.
 *
 * No wrapper "dark" div — like every other admin page, dark mode is
 * applied globally via ThemeContext putting "dark" on <html>.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

import IncidentFilters from "../components/IncidentFilters";
import IncidentTable from "../components/IncidentTable";
import IncidentActions from "../components/IncidentActions";
import Pagination from "../components/Pagination";
import Toast from "../components/Toast";
import EmptyState from "../components/EmptyState";

import { adminIncidentsAPI } from "../services/adminApi";
import { DEFAULT_INCIDENT_FILTERS } from "../data/adminMock";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 350;

export default function AdminIncidents() {
  const navigate = useNavigate();

  const [filters, setFilters] = useState(DEFAULT_INCIDENT_FILTERS);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const searchDebounceRef = useRef(null);

  const showToast = useCallback((message, type = "success") => {
    clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);
  useEffect(() => () => clearTimeout(toastTimerRef.current), []);
  useEffect(() => () => clearTimeout(searchDebounceRef.current), []);

  const load = useCallback((nextFilters, nextPage) => {
    setLoading(true);
    setError(null);
    adminIncidentsAPI
      .getAdminIncidents({ filters: nextFilters, page: nextPage, pageSize: PAGE_SIZE })
      .then(({ data }) => {
        setIncidents(data.incidents);
        setTotalCount(data.count);
        setTotalPages(data.totalPages ?? 1);
        setPage(data.page ?? nextPage);
      })
      .catch(() => setError("Failed to load incidents. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  // Initial load.
  useEffect(() => {
    load(DEFAULT_INCIDENT_FILTERS, 1);
  }, [load]);

  const handleFiltersChange = useCallback(
    (patch) => {
      const next = { ...filters, ...patch };
      setFilters(next);

      // Debounce only the free-text field; every other control (selects,
      // dates) should feel immediate.
      if (Object.prototype.hasOwnProperty.call(patch, "search")) {
        clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = setTimeout(() => load(next, 1), SEARCH_DEBOUNCE_MS);
      } else {
        load(next, 1);
      }
    },
    [filters, load],
  );

  const handleReset = useCallback(() => {
    clearTimeout(searchDebounceRef.current);
    setFilters(DEFAULT_INCIDENT_FILTERS);
    load(DEFAULT_INCIDENT_FILTERS, 1);
  }, [load]);

  const handlePageChange = useCallback(
    (nextPage) => load(filters, nextPage),
    [filters, load],
  );

  const handleView = useCallback(
    (id) => navigate(`/admin/incidents/${id}`),
    [navigate],
  );

  const handleStatusChange = useCallback(
    async (id, status) => {
      try {
        await adminIncidentsAPI.updateIncidentStatus(id, status);
        showToast("Incident status updated.");
        load(filters, page);
      } catch (err) {
        showToast(err?.message ?? "Failed to update status.", "error");
      }
    },
    [filters, page, load, showToast],
  );

  const handleDelete = useCallback(
    async (id) => {
      try {
        await adminIncidentsAPI.deleteIncident(id);
        showToast("Incident deleted.");
        load(filters, page);
      } catch (err) {
        showToast(err?.message ?? "Failed to delete incident.", "error");
      }
    },
    [filters, page, load, showToast],
  );

  return (
    <div className="space-y-4">
      <Toast toast={toast} />

      <IncidentFilters
        filters={filters}
        onChange={handleFiltersChange}
        onReset={handleReset}
        resultCount={totalCount}
        loading={loading}
      />

      {error ? (
        <div className="bg-white dark:bg-na-surface rounded-2xl border border-gray-100 dark:border-na-border shadow-sm">
          <EmptyState icon={AlertTriangle} title="Couldn't load incidents" description={error} />
          <div className="pb-6 flex justify-center">
            <button
              onClick={() => load(filters, page)}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/25 px-3 py-1.5 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        <>
          <IncidentTable
            incidents={incidents}
            loading={loading}
            onView={handleView}
            renderRowActions={(inc) => (
              <IncidentActions
                incident={inc}
                layout="menu"
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            )}
            emptyTitle="No incidents found"
            emptyDescription="Try adjusting your search or filters."
          />

          <Pagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
