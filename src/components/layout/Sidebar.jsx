/* eslint-disable react-hooks/set-state-in-effect */
/**
 * Sidebar.jsx
 *
 * FIXES:
 * ✓ Stable incident key in useEffect to prevent re-triggering on selection changes
 * ✓ Uses incident IDs instead of full array for dependency tracking
 *
 * Features in this version:
 *  - Smart Danger Score badge per card (🟢 Safe / 🟠 Moderate / 🔴 High Risk)
 *  - AI Safety Suggestion button — expands a 1–2 line tip below each card
 *  - Heatmap toggle button in header — emits onHeatmapToggle prop to Dashboard
 *  - All existing features preserved (search, stagger, NEW badge, logout)
 */
import React, { useState, useEffect, useRef, memo, useCallback } from "react";
import {
  Eye,
  LogOut,
  TrendingUp,
  X,
  Search,
  Sparkles,
  Layers,
  MapPin,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authHelpers } from "../../services/api";
import { getDangerScore } from "../../utils/dangerScore";

// ─── Static maps ─────────────────────────────────────────────────────────────
const TAG = {
  Theft:
    "bg-amber-50   dark:bg-amber-900/30  text-amber-700  dark:text-amber-300  border-amber-300  dark:border-amber-700",
  Robbery:
    "bg-red-50     dark:bg-red-900/30    text-red-700    dark:text-red-300    border-red-300    dark:border-red-700",
  Assault:
    "bg-orange-50  dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700",
  Burglary:
    "bg-purple-50  dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700",
  Vandalism:
    "bg-blue-50    dark:bg-blue-900/30   text-blue-700   dark:text-blue-300   border-blue-300   dark:border-blue-700",
  "Lost Item":
    "bg-sky-50     dark:bg-sky-900/30    text-sky-700    dark:text-sky-300    border-sky-300    dark:border-sky-700",
  "Item Found":
    "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
  Snatching:
    "bg-pink-50    dark:bg-pink-900/30   text-pink-700   dark:text-pink-300   border-pink-300   dark:border-pink-700",
  Harassment:
    "bg-rose-50    dark:bg-rose-900/30   text-rose-700   dark:text-rose-300   border-rose-300   dark:border-rose-700",
};
const EMOJI = {
  Theft: "💰",
  Robbery: "🔫",
  Assault: "🚨",
  Burglary: "🏠",
  Vandalism: "🔨",
  "Lost Item": "📦",
  "Item Found": "✅",
  Snatching: "🏃",
  Harassment: "⚠️",
};

function timeAgo(d) {
  if (!d) return "just now";
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function Highlight({ text = "", query = "" }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 dark:bg-yellow-500/40 text-inherit rounded-sm px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ─── IncidentCard ─────────────────────────────────────────────────────────────
const IncidentCard = memo(
  ({
    incident,
    index,
    visible,
    selected,
    isNew,
    query,
    onSelect,
    onPreview,
  }) => {
    const [showTip, setShowTip] = useState(false);

    const onClick = useCallback(
      () => onSelect(incident.id),
      [incident.id, onSelect],
    );
    const onEyeClick = useCallback(
      (e) => {
        e.stopPropagation();
        onPreview(incident);
      },
      [incident, onPreview],
    );
    const onTipClick = useCallback((e) => {
      e.stopPropagation();
      setShowTip((s) => !s);
    }, []);

    const tag =
      TAG[incident.type] ??
      "bg-gray-50 dark:bg-na-hover text-gray-600 dark:text-slate-400 border-gray-200 dark:border-na-border";
    const danger = getDangerScore(incident);

    return (
      <li
        id={`incident-${incident.id}`}
        onClick={onClick}
        className={[
          "relative rounded-xl p-3.5 cursor-pointer select-none",
          "bg-white dark:bg-na-card",
          "border-2 transition-all duration-250 ease-out",
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
          selected
            ? "border-blue-500 dark:border-blue-400 shadow-md shadow-blue-100 dark:shadow-blue-900/30 ring-4 ring-blue-100 dark:ring-blue-900/30"
            : "border-gray-100 dark:border-na-border hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-sm hover:-translate-y-px",
        ].join(" ")}
        style={{ transitionDelay: visible ? "0ms" : `${index * 55}ms` }}
      >
        {isNew && (
          <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm tracking-wide z-10">
            NEW
          </span>
        )}

        {/* ── User row ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 shadow-sm">
            {(incident.userName ?? incident.user ?? "?")
              .charAt(0)
              .toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-800 dark:text-slate-100 truncate leading-tight">
              {incident.userName ?? incident.user ?? "Anonymous"}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-slate-500">
              {timeAgo(incident.createdAt)}
            </p>
          </div>
          <span
            className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${tag}`}
          >
            {EMOJI[incident.type]} {incident.type}
          </span>
          <button
            onClick={onEyeClick}
            title="Preview on map"
            className="shrink-0 p-1 rounded-full text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 active:scale-90 transition-all"
          >
            <Eye size={14} />
          </button>
        </div>

        {/* ── Title ─────────────────────────────────────────────────────── */}
        <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-100 leading-snug mb-1">
          <Highlight text={incident.title} query={query} />
        </h3>

        {/* ── Description ───────────────────────────────────────────────── */}
        <p
          className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {incident.description}
        </p>

        {/* ── Footer: distance | danger score | AI tip btn | views ──────── */}
        <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
          {/* Distance */}
          {incident.distance != null && (
            <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/25 text-blue-600 dark:text-blue-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">
              <MapPin size={9} /> {incident.distance.toFixed(1)} km
            </span>
          )}

          {/* Danger score badge */}
          <span
            className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${danger.color}`}
          >
            {danger.label}
          </span>

          {/* AI Suggestion button */}
          <button
            onClick={onTipClick}
            title={showTip ? "Hide suggestion" : "AI safety tip"}
            className={[
              "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all duration-150 active:scale-90",
              showTip
                ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-600"
                : "bg-gray-50 dark:bg-na-hover text-gray-500 dark:text-slate-400 border-gray-200 dark:border-na-border hover:bg-violet-50 dark:hover:bg-violet-900/25 hover:text-violet-600 dark:hover:text-violet-400 hover:border-violet-300 dark:hover:border-violet-700",
            ].join(" ")}
          >
            <Sparkles size={9} />
            AI Tip
          </button>

          {/* Views — pushed to end */}
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-gray-400 dark:text-slate-500">
            <Eye size={9} /> {incident.views ?? 0}
          </span>
        </div>

        {/* ── AI Suggestion panel — slides in below ─────────────────────── */}
        {showTip && (
          <div
            className="mt-2.5 px-3 py-2.5 rounded-lg border text-[11px] leading-relaxed
              bg-violet-50 dark:bg-violet-900/20
              border-violet-200 dark:border-violet-800
              text-violet-800 dark:text-violet-300"
            style={{ animation: "tipSlideIn 0.2s ease both" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-1.5">
              <Sparkles size={11} className="shrink-0 mt-0.5 opacity-70" />
              <span>{danger.suggestion}</span>
            </div>
          </div>
        )}
      </li>
    );
  },
  (p, n) =>
    p.incident.id === n.incident.id &&
    p.visible === n.visible &&
    p.selected === n.selected &&
    p.isNew === n.isNew &&
    p.query === n.query &&
    p.incident.views === n.incident.views &&
    p.incident.distance === n.incident.distance,
);
IncidentCard.displayName = "IncidentCard";

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <li className="bg-white dark:bg-na-card border-2 border-gray-100 dark:border-na-border rounded-xl p-3.5 animate-pulse">
    <div className="flex items-center gap-2 mb-2.5">
      <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-na-hover" />
      <div className="flex-1 space-y-1">
        <div className="h-2.5 bg-gray-200 dark:bg-na-hover rounded w-24" />
        <div className="h-2 bg-gray-100 dark:bg-na-border rounded w-14" />
      </div>
    </div>
    <div className="space-y-1.5">
      <div className="h-3 bg-gray-200 dark:bg-na-hover rounded w-3/4" />
      <div className="h-2 bg-gray-100 dark:bg-na-border rounded w-full" />
      <div className="h-2 bg-gray-100 dark:bg-na-border rounded w-4/5" />
    </div>
    <div className="mt-2.5 flex gap-1.5">
      <div className="h-4 bg-gray-100 dark:bg-na-border rounded-full w-14" />
      <div className="h-4 bg-gray-100 dark:bg-na-border rounded-full w-16" />
    </div>
  </li>
);

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({
  incidents = [],
  selectedId,
  onSelect,
  onPreview,
  scrollRef,
  loading = false,
  query = "",
  totalNearby = 0,
  open = true,
  onClose,
  heatmapActive = false,
  onHeatmapToggle,
}) {
  const [visSet, setVisSet] = useState(new Set());
  const [newIds, setNewIds] = useState(new Set());
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);
  const prevLenRef = useRef(0);
  const navigate = useNavigate();

  // Stagger reveal — use stable ID key so selection changes don't retrigger
  const incidentIdsKey = incidents.map((i) => i.id).join(",");

  useEffect(() => {
    setVisSet(new Set());
    const ts = incidents.map((_, i) =>
      setTimeout(() => setVisSet((s) => new Set([...s, i])), i * 55),
    );
    return () => ts.forEach(clearTimeout);
  }, [incidentIdsKey]); // eslint-disable-line

  // NEW badge — also uses stable key
  useEffect(() => {
    const prev = prevLenRef.current;
    prevLenRef.current = incidents.length;
    if (incidents.length <= prev || prev === 0) return;
    const fresh = new Set(
      incidents.slice(0, incidents.length - prev).map((i) => i.id),
    );
    setNewIds(fresh);
    const t = setTimeout(() => setNewIds(new Set()), 8000);
    return () => clearTimeout(t);
  }, [incidentIdsKey]); // eslint-disable-line

  const displayQuery = search || query;
  const displayList = displayQuery.trim()
    ? incidents.filter(
        (i) =>
          i.title.toLowerCase().includes(displayQuery.toLowerCase()) ||
          i.type.toLowerCase().includes(displayQuery.toLowerCase()),
      )
    : incidents;

  const handleSelect = useCallback((id) => onSelect?.(id), [onSelect]);
  const handlePreview = useCallback((i) => onPreview?.(i), [onPreview]);

  return (
    <>
      <aside
        className={[
          "flex flex-col bg-gray-50 dark:bg-na-navy",
          "border-r border-gray-200 dark:border-na-border",
          "md:relative md:w-[30%] md:h-full md:translate-x-0",
          "fixed inset-y-0 left-0 z-[500] w-[85vw] max-w-sm",
          "transition-transform duration-300 ease-in-out",
          open ? "translate-x-0 shadow-2xl" : "-translate-x-full",
        ].join(" ")}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="shrink-0 bg-white dark:bg-na-surface border-b border-gray-100 dark:border-na-border">
          {/* Title row + heatmap toggle */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div>
              <h2 className="text-sm font-bold text-gray-800 dark:text-slate-100 tracking-tight">
                Nearby Incidents
              </h2>
              <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
                {loading ? "Loading…" : `${totalNearby} within 5 km`}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Heatmap toggle */}
              {onHeatmapToggle && (
                <button
                  onClick={onHeatmapToggle}
                  title={
                    heatmapActive ? "Switch to markers" : "Switch to heatmap"
                  }
                  className={[
                    "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all duration-200 active:scale-95",
                    heatmapActive
                      ? "bg-orange-500 text-white border-orange-600 shadow-sm"
                      : "bg-gray-50 dark:bg-na-hover text-gray-600 dark:text-slate-400 border-gray-200 dark:border-na-border hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-300",
                  ].join(" ")}
                >
                  <Layers size={12} />
                  {heatmapActive ? "Markers" : "Heatmap"}
                </button>
              )}

              {onClose && (
                <button
                  onClick={onClose}
                  className="md:hidden p-1.5 rounded-lg text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-na-hover transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="px-3 pb-3">
            <div className="relative">
              <Search
                size={13}
                className={`absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                  focused
                    ? "text-blue-500"
                    : "text-gray-400 dark:text-slate-500"
                }`}
              />
              <input
                type="text"
                placeholder="Filter incidents…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className="
                  w-full pl-7 pr-6 py-2 rounded-lg text-xs
                  focus:outline-none focus:ring-0 border
                  bg-gray-50 dark:bg-na-input
                  text-gray-700 dark:text-slate-200
                  placeholder-gray-400 dark:placeholder-slate-500
                  border-gray-200 dark:border-na-border
                  hover:bg-white dark:hover:bg-na-hover
                  focus:bg-white dark:focus:bg-na-input
                  focus:border-blue-400 dark:focus:border-na-border
                  transition-colors duration-150
                "
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                >
                  <X size={11} />
                </button>
              )}
            </div>
            {displayQuery && (
              <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 ml-0.5">
                {displayList.length} result{displayList.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Mini stats */}
          {!loading && (
            <div className="flex gap-1.5 px-3 pb-3">
              {[
                {
                  val: totalNearby,
                  label: "Nearby",
                  cls: "bg-blue-50 dark:bg-blue-900/25 text-blue-600 dark:text-blue-400",
                },
                {
                  val: incidents.length,
                  label: "Showing",
                  cls: "bg-violet-50 dark:bg-violet-900/25 text-violet-600 dark:text-violet-400",
                },
                {
                  val: newIds.size || "—",
                  label: "New",
                  cls: "bg-emerald-50 dark:bg-emerald-900/25 text-emerald-600 dark:text-emerald-400",
                },
              ].map(({ val, label, cls }) => (
                <div
                  key={label}
                  className={`flex-1 ${cls} rounded-lg px-2 py-1.5 text-center`}
                >
                  <p className="text-sm font-bold leading-none">{val}</p>
                  <p className="text-[9px] mt-0.5 opacity-80 font-medium">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Feed ────────────────────────────────────────────────────────── */}
        <ul
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5"
          role="list"
          aria-label="Incident feed"
        >
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : displayList.length === 0 ? (
            <li className="flex flex-col items-center text-gray-400 dark:text-slate-600 gap-3 pt-14">
              <TrendingUp size={36} strokeWidth={1.5} />
              <p className="text-sm font-medium">
                {displayQuery ? "No results found" : "No incidents nearby"}
              </p>
              <p className="text-xs text-center px-6 opacity-70">
                {displayQuery
                  ? "Try a different search term"
                  : "Be the first to report an incident in your area"}
              </p>
            </li>
          ) : (
            displayList.map((inc, idx) => (
              <IncidentCard
                key={inc.id}
                incident={inc}
                index={idx}
                visible={visSet.has(idx)}
                selected={selectedId === inc.id}
                isNew={newIds.has(inc.id)}
                query={displayQuery}
                onSelect={handleSelect}
                onPreview={handlePreview}
              />
            ))
          )}
        </ul>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="shrink-0 p-3 border-t border-gray-100 dark:border-na-border bg-white dark:bg-na-surface">
          <button
            onClick={() => {
              authHelpers.logout();
              navigate("/");
            }}
            className="w-full flex items-center justify-center gap-2
              bg-gradient-to-r from-blue-600 to-blue-700
              hover:from-blue-700 hover:to-blue-800
              active:scale-[.98] text-white
              py-2.5 rounded-xl font-semibold text-sm
              transition-all shadow-sm hover:shadow-md"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      {open && (
        <div
          className="md:hidden fixed inset-0 z-[499] bg-black/40 backdrop-blur-[2px]"
          onClick={onClose}
        />
      )}

      <style>{`
        @keyframes tipSlideIn {
          from { opacity: 0; transform: translateY(-6px); max-height: 0; }
          to   { opacity: 1; transform: translateY(0);   max-height: 120px; }
        }
      `}</style>
    </>
  );
}

export default memo(Sidebar);
