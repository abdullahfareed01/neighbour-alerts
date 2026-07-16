/* eslint-disable react-hooks/set-state-in-effect */
/**
 * UserProfile.jsx
 *
 * Dark mode: relies on <html class="dark"> — NO local dark wrapper div.
 * Uses unified na-* token palette (same as Dashboard + Sidebar).
 *
 * FIXES:
 * ✓ Uses the authenticated user from AuthContext instead of the hardcoded
 *   CURRENT_USER constant — previously this page would show the wrong
 *   person's reports once real, distinct users existed.
 * ✓ Logout button now actually clears the session via useAuth().logout()
 *   — before, it only navigated to "/" without clearing auth state, so
 *   the user was still "logged in" underneath.
 * ✓ TAG/EMOJI incident-type maps now imported from
 *   constants/incidentTypes.js instead of duplicated locally.
 *
 * Token legend:
 *  bg-white / dark:bg-na-surface   — header, footer, profile card
 *  bg-gray-50 / dark:bg-na-navy    — page background
 *  bg-white / dark:bg-na-card      — incident list items
 *  border-gray-200 / dark:border-na-border
 *  text-gray-800 / dark:text-slate-100
 *  text-gray-500 / dark:text-slate-400
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowLeft, MapPin, Calendar, Shield,
  Eye, AlertTriangle, Loader2, LogOut, TrendingUp,
} from "lucide-react";

import CrimeMap         from "../components/map/CrimeMap";
import ThemeToggle      from "../components/ui/ThemeToggle";
import { useTheme }     from "../context/ThemeContext";
import { useAuth }      from "../context/AuthContext";
import { useLocation, DEFAULT_LOCATION } from "../context/LocationContext";
import { incidentsAPI } from "../services/api";
import { CURRENT_USER } from "../data/incidents";
import { getDistanceFromLatLonInKm } from "../utils/haversine";
import { TYPE_TAG_CLASS as TAG, TYPE_EMOJI as EMOJI } from "../constants/incidentTypes";

function timeAgo(d) {
  if (!d) return "";
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ─── Stat box ─────────────────────────────────────────────────────────────────
function StatBox({ label, value, colorCls, icon: Icon }) {
  return (
    <div className="bg-gray-50 dark:bg-na-hover rounded-xl p-3 border border-gray-100 dark:border-na-border flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colorCls}`}>
        <Icon size={17} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-gray-800 dark:text-slate-100 leading-none">{value}</p>
        <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5 truncate">{label}</p>
      </div>
    </div>
  );
}
// ─── UserProfile ──────────────────────────────────────────────────────────────
export default function UserProfile() {
  const navigate             = useNavigate();
  const { dark }             = useTheme();
  const { user, logout }     = useAuth();
  // CURRENT_USER is only a defensive fallback — ProtectedRoute guarantees
  // `user` is set on this page, but this avoids a crash if that ever changes.
  const liveUser              = user ?? CURRENT_USER;
  const { location: gpsLoc } = useLocation();
  const userLocation         = gpsLoc ?? DEFAULT_LOCATION;

  const [incidents,  setIncidents]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [mapCommand, setMapCommand] = useState(null);

  // Fetch ALL user incidents — no distance filter on profile page
  useEffect(() => {
    setLoading(true);
    incidentsAPI.getUserIncidents(liveUser.id)
      .then(({ data }) => {
        const withDist = data.incidents
          .map((i) => ({
            ...i,
            views:    i.views ?? 0,
            distance: getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, i.lat, i.lng),
          }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setIncidents(withDist);
      })
      .catch(() => setError("Failed to load your incidents"))
      .finally(() => setLoading(false));
  }, [liveUser.id]); // eslint-disable-line

  // Stats
  const stats = useMemo(() => {
    const counts = incidents.reduce((acc, i) => {
      acc[i.type] = (acc[i.type] ?? 0) + 1;
      return acc;
    }, {});
    const top   = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    const views = incidents.reduce((s, i) => s + (i.views ?? 0), 0);
    return { total: incidents.length, top, views };
  }, [incidents]);

  const handleCardClick = useCallback((id) => {
    setSelectedId(id);
    const inc = incidents.find((i) => i.id === id);
    if (inc) setMapCommand({ type: "fitBounds", lat: inc.lat, lng: inc.lng, triggeredAt: Date.now() });
  }, [incidents]);

  const handleEye = useCallback((inc) => {
    setMapCommand({ type: "flyTo", lat: inc.lat, lng: inc.lng, zoom: 19, triggeredAt: Date.now() });
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/");
  }, [logout, navigate]);

  // NO dark wrapper div
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-na-navy">

      {/* Header */}
      <header className="shrink-0 flex items-center gap-3 px-4 h-[60px]
        bg-white dark:bg-na-surface
        border-b border-gray-100 dark:border-na-border shadow-sm">
        <button
          onClick={() => navigate("/dashboard")}
          className="p-2 rounded-xl text-gray-500 dark:text-slate-400
            hover:text-blue-600 dark:hover:text-blue-400
            hover:bg-blue-50 dark:hover:bg-na-hover
            transition-all active:scale-90"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent flex-1">
          My Profile
        </h1>
        <ThemeToggle />
      </header>

      {/* Body */}
      <div className="flex flex-1 min-h-0">

        {/* ── Left panel ─────────────────────────────────────────────────── */}
        <aside className="w-full md:w-[38%] h-full flex flex-col
          bg-gray-50 dark:bg-na-navy
          border-r border-gray-200 dark:border-na-border">

          {/* Profile card */}
          <div className="shrink-0 m-4 bg-white dark:bg-na-surface rounded-2xl p-5
            border border-gray-100 dark:border-na-border shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-white flex items-center justify-center text-2xl font-bold shadow-md shrink-0">
                {liveUser.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 truncate">
                  {liveUser.name}
                </h2>
                <p className="text-sm text-gray-400 dark:text-slate-500 truncate">
                  {liveUser.email}
                </p>
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-400 dark:text-slate-500">
                  <Calendar size={11} />
                  <span>Joined {new Date(liveUser.joinedAt ?? liveUser.createdAt ?? Date.now()).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <StatBox label="Reports"     value={stats.total} icon={Shield}       colorCls="bg-blue-500" />
              <StatBox label="Top type"    value={stats.top}   icon={AlertTriangle} colorCls="bg-violet-500" />
              <StatBox label="Total views" value={stats.views} icon={Eye}           colorCls="bg-emerald-500" />
            </div>
          </div>

          {/* Incident list */}
          <div className="shrink-0 px-4 pb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700 dark:text-slate-300">My Reports</h3>
            <span className="text-[11px] text-gray-400 dark:text-slate-500">{incidents.length} total</span>
          </div>

          <ul className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 space-y-2.5">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="bg-white dark:bg-na-card rounded-xl p-4 border border-gray-100 dark:border-na-border animate-pulse">
                  <div className="h-3 bg-gray-200 dark:bg-na-hover rounded w-24 mb-2" />
                  <div className="h-2.5 bg-gray-200 dark:bg-na-hover rounded w-full mb-1" />
                  <div className="h-2.5 bg-gray-100 dark:bg-na-border rounded w-3/4" />
                </li>
              ))
            ) : error ? (
              <li className="text-center text-sm text-red-400 pt-8">{error}</li>
            ) : incidents.length === 0 ? (
              <li className="flex flex-col items-center text-gray-400 dark:text-slate-600 gap-3 pt-12">
                <TrendingUp size={40} strokeWidth={1} />
                <p className="text-sm">No reports yet</p>
              </li>
            ) : (
              incidents.map((inc) => {
                const isSel = selectedId === inc.id;
                const tag   = TAG[inc.type] ?? "bg-gray-100 dark:bg-na-hover text-gray-600 dark:text-slate-400 border-gray-200";
                return (
                  <li
                    key={inc.id}
                    onClick={() => handleCardClick(inc.id)}
                    className={[
                      "bg-white dark:bg-na-card rounded-xl p-3.5 border-2 cursor-pointer transition-all duration-200",
                      isSel
                        ? "border-blue-500 dark:border-blue-400 shadow-lg ring-4 ring-blue-100 dark:ring-blue-900/30"
                        : "border-gray-100 dark:border-na-border hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-sm",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tag}`}>
                        {EMOJI[inc.type]} {inc.type}
                      </span>
                      <span className="ml-auto text-[10px] text-gray-400 dark:text-slate-500">{timeAgo(inc.createdAt)}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEye(inc); }}
                        className="p-1 rounded-full text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all active:scale-90"
                        title="Preview on map"
                      >
                        <Eye size={13} />
                      </button>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 leading-snug">
                      {inc.title}
                    </p>
                    <p
                      className="text-xs text-gray-500 dark:text-slate-400 mt-0.5"
                      style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                    >
                      {inc.description}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-[10px]">
                      <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
                        <MapPin size={10} /> {inc.distance.toFixed(1)} km
                      </span>
                      <span className="flex items-center gap-1 text-gray-400 dark:text-slate-500">
                        <Eye size={10} /> {inc.views ?? 0}
                      </span>
                    </div>
                  </li>
                );
              })
            )}
          </ul>

          {/* Logout */}
          <div className="shrink-0 p-4 border-t border-gray-100 dark:border-na-border bg-white dark:bg-na-surface">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2
                bg-gradient-to-r from-blue-600 to-blue-700
                hover:from-blue-700 hover:to-blue-800
                active:scale-[.98] text-white py-2.5 rounded-xl font-semibold text-sm
                transition-all shadow-sm hover:shadow-md"
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>
        </aside>

        {/* ── Map ────────────────────────────────────────────────────────── */}
        <div className="hidden md:block flex-1 relative">
          {loading ? (
            <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-na-surface">
              <div className="flex items-center gap-2 text-gray-400 dark:text-slate-500 text-sm">
                <Loader2 className="animate-spin" size={18} />
                Loading map…
              </div>
            </div>
          ) : (
            <CrimeMap
              incidents={incidents}
              selectedId={selectedId}
              onSelect={handleCardClick}
              mapCommand={mapCommand}
              dark={dark}
              userLocation={userLocation}
            />
          )}
        </div>
      </div>
    </div>
  );
}