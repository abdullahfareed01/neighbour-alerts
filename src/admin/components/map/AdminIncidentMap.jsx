/**
 * admin/components/map/AdminIncidentMap.jsx
 *
 * Phase 4 — Admin Incident Map.
 *
 * A dedicated, LIGHTWEIGHT map for admin monitoring — deliberately NOT a
 * reuse of components/map/CrimeMap.jsx. CrimeMap.jsx is a complex,
 * user-facing component (GPS location, user-to-incident routing, animated
 * route polylines, heatmap layer, MapCommandController, popup
 * orchestration, mobile resize quirks). None of that is relevant here:
 * the admin map's only job is "show these incidents on a map, let an
 * admin click one to see what it is and jump to its detail page."
 *
 * This component is purely presentational — it receives an already
 * filtered `incidents` array as a prop and renders it. It does not know
 * about adminApi.js, adminMock.js, or filter state; that all lives in
 * admin/pages/AdminMap.jsx, matching the "dumb component / smart page"
 * split already established by IncidentTable.jsx / IncidentFilters.jsx.
 *
 * Marker color language:
 *   - Fill color  = severity tier (SEVERITY_DOT_COLOR — same red/amber/
 *     emerald used by SeverityBadge everywhere else in the admin section)
 *   - Ring color  = incident status (STATUS_DOT_COLOR — same colors used
 *     by StatusBadge / the dashboard's status summary)
 * So a marker communicates both dimensions at a glance without needing a
 * click, and the popup itself reuses the real StatusBadge/SeverityBadge
 * components so it's pixel-consistent with the incident table.
 */
import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Eye, MapPin } from "lucide-react";

import StatusBadge from "../StatusBadge";
import SeverityBadge from "../SeverityBadge";
import { SEVERITY_DEFS, SEVERITY_DOT_COLOR, getSeverityTier } from "../../constants/severity";
import { INCIDENT_STATUS_DEFS, STATUS_DOT_COLOR } from "../../constants/incidentStatus";
import { TYPE_TAG_CLASS, TYPE_EMOJI } from "../../../constants/incidentTypes";
import { formatDateTime, timeAgo } from "../../utils/formatDate";
import { DEFAULT_LOCATION } from "../../../context/LocationContext";

const TILES = {
  light: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
};
const TILE_ATTR = {
  light: "© OpenStreetMap",
  dark: "© OpenStreetMap © CartoDB",
};

const DEF_ZOOM = 12;
const SINGLE_ZOOM = 15;
const MAX_ZOOM = 18;

// ─── Marker icon cache ──────────────────────────────────────────────────────
const _icons = {};

function makeIncidentIcon(severityTier, status) {
  const key = `${severityTier}-${status}`;
  if (_icons[key]) return _icons[key];

  const fill = SEVERITY_DOT_COLOR[severityTier] ?? "#6b7280";
  const ring = STATUS_DOT_COLOR[status] ?? "#94a3b8";
  const size = 24;
  const c = size / 2;
  const r = 7.5;

  _icons[key] = new L.DivIcon({
    className: "admin-incident-marker",
    html: `<div style="width:${size}px;height:${size}px;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.35))">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${c}" cy="${c}" r="${r}" fill="${fill}" stroke="${ring}" stroke-width="3" />
        <circle cx="${c}" cy="${c}" r="2.2" fill="white" opacity="0.9" />
      </svg>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [c, c],
    popupAnchor: [0, -c],
  });
  return _icons[key];
}

// ─── FitBounds — recenters/refits whenever the incident set changes ───────
function FitBounds({ incidents }) {
  const map = useMap();
  const key = useMemo(() => incidents.map((i) => i.id).join(","), [incidents]);
  const doneKeyRef = useRef(null);

  useEffect(() => {
    if (doneKeyRef.current === key) return;
    doneKeyRef.current = key;

    if (incidents.length === 0) {
      map.setView([DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng], DEF_ZOOM, { animate: true });
      return;
    }
    if (incidents.length === 1) {
      map.setView([incidents[0].lat, incidents[0].lng], SINGLE_ZOOM, { animate: true });
      return;
    }
    const bounds = L.latLngBounds(incidents.map((i) => L.latLng(i.lat, i.lng)));
    map.fitBounds(bounds, { padding: [56, 56], maxZoom: 15, animate: true });
  }, [key, incidents, map]);

  return null;
}

// ─── Resize handler — keeps Leaflet's internal size cache honest when the
// surrounding admin layout (filters panel, sidebar) changes height/width.
// Same ResizeObserver pattern used by CrimeMap.jsx's MapResizeHandler,
// re-implemented locally (not imported) to avoid coupling this lightweight
// component to the user-facing map file.
function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;
    const ro = new ResizeObserver(() => {
      map.invalidateSize({ animate: false, pan: false });
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [map]);
  return null;
}

// ─── Legend ─────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div className="absolute bottom-3 left-3 z-[999] bg-white/95 dark:bg-na-surface/95 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-na-border shadow-lg px-3 py-2.5 text-[10px] leading-relaxed max-w-[168px]">
      <p className="font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
        Severity (fill)
      </p>
      <div className="space-y-1 mb-2">
        {SEVERITY_DEFS.map((d) => (
          <div key={d.tier} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: d.dotColor }}
            />
            <span className="text-gray-600 dark:text-slate-300">{d.label}</span>
          </div>
        ))}
      </div>
      <p className="font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
        Status (ring)
      </p>
      <div className="space-y-1">
        {INCIDENT_STATUS_DEFS.map((d) => (
          <div key={d.status} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 border-2"
              style={{ borderColor: d.dotColor, backgroundColor: "transparent" }}
            />
            <span className="text-gray-600 dark:text-slate-300">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AdminIncidentMap ───────────────────────────────────────────────────────
export default function AdminIncidentMap({ incidents = [], dark = false }) {
  const navigate = useNavigate();

  const tileUrl = dark ? TILES.dark : TILES.light;
  const tileAttr = dark ? TILE_ATTR.dark : TILE_ATTR.light;

  const initialCenter = incidents.length
    ? [incidents[0].lat, incidents[0].lng]
    : [DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng];

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={initialCenter}
        zoom={DEF_ZOOM}
        maxZoom={MAX_ZOOM}
        minZoom={9}
        className="h-full w-full"
        key="admin-incident-map"
        zoomControl
      >
        <TileLayer key={tileUrl} url={tileUrl} attribution={tileAttr} maxZoom={19} />

        <MapResizeHandler />
        <FitBounds incidents={incidents} />

        {incidents.map((inc) => {
          const tier = getSeverityTier(inc.type);
          const tagCls =
            TYPE_TAG_CLASS[inc.type] ??
            "bg-gray-50 dark:bg-na-hover text-gray-600 dark:text-slate-400 border-gray-200 dark:border-na-border";

          return (
            <Marker
              key={inc.id}
              position={[inc.lat, inc.lng]}
              icon={makeIncidentIcon(tier, inc.status)}
            >
              <Popup minWidth={220} maxWidth={260}>
                <div className="min-w-[200px]">
                  <p className="text-[10px] font-mono text-gray-400 dark:text-slate-500 mb-1">
                    {inc.id}
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-slate-100 leading-snug mb-1">
                    {inc.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-2 leading-relaxed">
                    {inc.description}
                  </p>

                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    <StatusBadge status={inc.status} />
                    <SeverityBadge type={inc.type} />
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${tagCls}`}
                    >
                      {TYPE_EMOJI[inc.type] ?? "📍"} {inc.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-slate-500 mb-1">
                    <MapPin size={11} className="shrink-0" />
                    {inc.lat.toFixed(5)}, {inc.lng.toFixed(5)}
                  </div>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 mb-3">
                    {formatDateTime(inc.createdAt)} · {timeAgo(inc.createdAt)}
                  </p>

                  <button
                    type="button"
                    onClick={() => navigate(`/admin/incidents/${inc.id}`)}
                    className="w-full flex items-center justify-center gap-1.5
                      bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold
                      py-1.5 rounded-lg transition-colors active:scale-[.98]"
                  >
                    <Eye size={12} />
                    View details
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <Legend />
    </div>
  );
}
