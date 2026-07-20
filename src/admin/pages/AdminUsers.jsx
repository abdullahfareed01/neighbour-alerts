/**
 * admin/pages/AdminUsers.jsx
 *
 * Phase 5 — User Management.
 *
 * Owns all User Management state (filters, pagination, loading/error,
 * toast) and is the only thing that talks to adminApi.js for this page —
 * UserFilters/UserTable/UserActions stay "dumb" presentational
 * components, exactly the split AdminIncidents.jsx documents in its own
 * header for the Incident Management page. This page mirrors that file
 * structure line-for-line on purpose, so the two management screens stay
 * easy to reason about together.
 *
 * Search is debounced here (not inside UserFilters, per that component's
 * own header comment) so free-text typing doesn't fire a request per
 * keystroke; the status filter refetches immediately.
 *
 * No wrapper "dark" div — like every other admin page, dark mode is
 * applied globally via ThemeContext putting "dark" on <html>.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

import UserFilters from "../components/UserFilters";
import UserTable from "../components/UserTable";
import UserActions from "../components/UserActions";
import Pagination from "../components/Pagination";
import Toast from "../components/Toast";
import EmptyState from "../components/EmptyState";

import { adminUsersAPI } from "../services/adminApi";
import { DEFAULT_USER_FILTERS } from "../data/adminUsersMock";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 350;

export default function AdminUsers() {
  const navigate = useNavigate();

  const [filters, setFilters] = useState(DEFAULT_USER_FILTERS);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [users, setUsers] = useState([]);
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
    adminUsersAPI
      .getAdminUsers({ filters: nextFilters, page: nextPage, pageSize: PAGE_SIZE })
      .then(({ data }) => {
        setUsers(data.users);
        setTotalCount(data.count);
        setTotalPages(data.totalPages ?? 1);
        setPage(data.page ?? nextPage);
      })
      .catch(() => setError("Failed to load users. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  // Initial load.
  useEffect(() => {
    load(DEFAULT_USER_FILTERS, 1);
  }, [load]);

  const handleFiltersChange = useCallback(
    (patch) => {
      const next = { ...filters, ...patch };
      setFilters(next);

      // Debounce only the free-text field; the status select should
      // feel immediate.
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
    setFilters(DEFAULT_USER_FILTERS);
    load(DEFAULT_USER_FILTERS, 1);
  }, [load]);

  const handlePageChange = useCallback(
    (nextPage) => load(filters, nextPage),
    [filters, load],
  );

  const handleView = useCallback(
    (id) => navigate(`/admin/users/${id}`),
    [navigate],
  );

  const handleSuspend = useCallback(
    async (id) => {
      try {
        await adminUsersAPI.suspendUser(id);
        showToast("Account suspended.");
        load(filters, page);
      } catch (err) {
        showToast(err?.message ?? "Failed to suspend account.", "error");
      }
    },
    [filters, page, load, showToast],
  );

  const handleRestore = useCallback(
    async (id) => {
      try {
        await adminUsersAPI.restoreUser(id);
        showToast("Account restored.");
        load(filters, page);
      } catch (err) {
        showToast(err?.message ?? "Failed to restore account.", "error");
      }
    },
    [filters, page, load, showToast],
  );

  return (
    <div className="space-y-4">
      <Toast toast={toast} />

      <UserFilters
        filters={filters}
        onChange={handleFiltersChange}
        onReset={handleReset}
        resultCount={totalCount}
        loading={loading}
      />

      {error ? (
        <div className="bg-white dark:bg-na-surface rounded-2xl border border-gray-100 dark:border-na-border shadow-sm">
          <EmptyState icon={AlertTriangle} title="Couldn't load users" description={error} />
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
          <UserTable
            users={users}
            loading={loading}
            onView={handleView}
            renderRowActions={(u) => (
              <UserActions
                user={u}
                layout="menu"
                onSuspend={handleSuspend}
                onRestore={handleRestore}
              />
            )}
            emptyTitle="No users found"
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
