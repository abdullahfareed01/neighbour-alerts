/**
 * admin/pages/AdminMap.jsx
 *
 * Phase 4 — Admin Incident Map.
 *
 * Owns filter state and data fetching for the map, exactly the way
 * AdminIncidents.jsx owns it for the table — AdminIncidentMap.jsx itself
 * stays a dumb, presentational component that just renders whatever
 * `incidents` array it's given.
 *
 * Data flow:
 *   AdminMap (this file) --filters--> adminIncidentsAPI.getAdminIncidents
 *     --> adminMock.js (applyIncidentFilters) --> incidents (unpaginated)
 *
 * IMPORTANT: getAdminIncidents({ filters }) is called WITHOUT `pageSize`.
 * Looking at adminApi.js, the pagination branch only runs `if (pageSize)`;
 * omitting it returns the full filtered — but unpaginated — incident list,
 * which is exactly what a map needs (a 10-per-page slice would be
 * geographically meaningless). This required no changes to adminApi.js or
 * adminMock.js at all.
 *
 * Filters reuse the exact same IncidentFilters component and
 * DEFAULT_INCIDENT_FILTERS shape as AdminIncidents.jsx (same debounce
 * convention: only free-text search is debounced), so the map and the
 * incident table can never drift into conflicting filter definitions.
 *
 * No wrapper "dark" div — like every other admin page, dark mode is
 * applied globally via ThemeContext putting "dark" on <html>.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, MapPin } from "lucide-react";

import IncidentFilters from "../components/IncidentFilters";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import AdminIncidentMap from "../components/map/AdminIncidentMap";

import { adminIncidentsAPI } from "../services/adminApi";
import { DEFAULT_INCIDENT_FILTERS } from "../data/adminMock";
import { useTheme } from "../../context/ThemeContext";

const SEARCH_DEBOUNCE_MS = 350;

export default function AdminMap() {
  const { dark } = useTheme();

  const [filters, setFilters] = useState(DEFAULT_INCIDENT_FILTERS);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const searchDebounceRef = useRef(null);
  useEffect(() => () => clearTimeout(searchDebounceRef.current), []);

  const load = useCallback((nextFilters) => {
    setLoading(true);
    setError(null);
    adminIncidentsAPI
      .getAdminIncidents({ filters: nextFilters })
      .then(({ data }) => {
        // Defensive: only plot incidents with usable coordinates.
        const plottable = data.incidents.filter(
          (i) => typeof i.lat === "number" && typeof i.lng === "number",
        );
        setIncidents(plottable);
      })
      .catch(() =>
        setError("Failed to load incidents for the map. Please try again."),
      )
      .finally(() => setLoading(false));
  }, []);

  // Initial load.
  useEffect(() => {
    const timer = setTimeout(() => {
      load(DEFAULT_INCIDENT_FILTERS);
    }, 0);

    return () => clearTimeout(timer);
  }, [load]);

  const handleFiltersChange = useCallback(
    (patch) => {
      const next = { ...filters, ...patch };
      setFilters(next);

      if (Object.prototype.hasOwnProperty.call(patch, "search")) {
        clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = setTimeout(
          () => load(next),
          SEARCH_DEBOUNCE_MS,
        );
      } else {
        load(next);
      }
    },
    [filters, load],
  );

  const handleReset = useCallback(() => {
    clearTimeout(searchDebounceRef.current);
    setFilters(DEFAULT_INCIDENT_FILTERS);
    load(DEFAULT_INCIDENT_FILTERS);
  }, [load]);

  return (
    <div className="space-y-4">
      <IncidentFilters
        filters={filters}
        onChange={handleFiltersChange}
        onReset={handleReset}
        resultCount={incidents.length}
        loading={loading}
      />

      {error ? (
        <div className="bg-white dark:bg-na-surface rounded-2xl border border-gray-100 dark:border-na-border shadow-sm">
          <EmptyState
            icon={AlertTriangle}
            title="Couldn't load the map"
            description={error}
          />
          <div className="pb-6 flex justify-center">
            <button
              onClick={() => load(filters)}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/25 px-3 py-1.5 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      ) : loading ? (
        <div className="bg-white dark:bg-na-surface rounded-2xl border border-gray-100 dark:border-na-border shadow-sm">
          <LoadingState label="Loading incidents…" />
        </div>
      ) : incidents.length === 0 ? (
        <div className="bg-white dark:bg-na-surface rounded-2xl border border-gray-100 dark:border-na-border shadow-sm">
          <EmptyState
            icon={MapPin}
            title="No incidents to display"
            description="Try adjusting your search or filters."
          />
        </div>
      ) : (
        <div
          className="rounded-2xl border border-gray-100 dark:border-na-border shadow-sm overflow-hidden"
          style={{ height: "68vh", minHeight: 420 }}
        >
          <AdminIncidentMap incidents={incidents} dark={dark} />
        </div>
      )}
    </div>
  );
}
