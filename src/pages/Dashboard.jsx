/**
 * Dashboard.jsx
 *
 * FIXES:
 * ✓ Proper React imports (useState fix)
 * ✓ Initial map view: fitBounds to include user + all incidents + 5km circle
 * ✓ Sidebar click: smooth flyTo/fitBounds between user & selected incident
 * ✓ Eye button: direct zoom to marker (focus mode)
 * ✓ Marker click: smooth flyTo animation from user to incident (NEW FIX)
 * ✓ Popup behavior: proper offset to prevent overflow
 * ✓ Route drawing: only after map movement completes
 * ✓ Analytics panel with animated charts (NEW FEATURE)
 *
 * Dark mode: relies entirely on ThemeContext putting "dark" on <html>.
 * NO wrapper div with dark class — that double-scoping was causing cascade failures.
 *
 * Header layout:
 *   LEFT:   [Hamburger] [Search]
 *   CENTER: [Brand + Tagline] — absolutely centered
 *   RIGHT:  [Analytics] [ThemeToggle] [Avatar]
 *
 * Location: reads live GPS from LocationContext. Circle and distances
 * update automatically when GPS resolves.
 */

import React, {
  useState,
  useRef,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  Menu,
  CheckCircle,
  AlertTriangle,
  BarChart3,
} from "lucide-react";

import SidebarComponent from "../components/layout/Sidebar";
import CrimeMap from "../components/map/CrimeMap";
import CreatePostModal from "../components/CreatePost/CreatePostModal";
import FloatingAddButton from "../components/CreatePost/FloatingAddButton";
import SplashScreen from "../components/ui/SplashScreen";
import ReportSuccessAnimation from "../components/ui/ReportSuccessAnimation";
import LocationPermissionBanner from "../components/ui/LocationPermissionBanner";
import ThemeToggle from "../components/ui/ThemeToggle";
import AnalyticsPanel from "../components/analytics/AnalyticsPanel";

import { useTheme } from "../context/ThemeContext";
import { useLocation, DEFAULT_LOCATION } from "../context/LocationContext";
import { incidentsAPI } from "../services/api";
import { getDistanceFromLatLonInKm } from "../utils/haversine";
import { CURRENT_USER } from "../data/incidents";
import { authHelpers } from "../services/api";

const RADIUS_KM = 5;

const sortNew = (arr) =>
  [...arr].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

// Map commands with improved zoom levels and behavior
const mkFlyTo = (lat, lng, zoom = 17) => ({
  type: "flyTo",
  lat,
  lng,
  zoom,
  triggeredAt: Date.now(),
});
const mkFitBounds = (lat, lng) => ({
  type: "fitBounds",
  lat,
  lng,
  triggeredAt: Date.now(),
});
const mkInitialFit = (userLat, userLng, incidents) => ({
  type: "initialFit",
  userLat,
  userLng,
  incidents,
  triggeredAt: Date.now(),
});

export default function Dashboard() {
  const navigate = useNavigate();
  const { dark } = useTheme();
  const liveUser = authHelpers.getUser() ?? CURRENT_USER;
  const { location: gpsLoc, status: locStatus } = useLocation();

  // Live user location — switches to real GPS when granted, fallback until then
  const userLocation = useMemo(() => gpsLoc ?? DEFAULT_LOCATION, [gpsLoc]);

  // addDist reads live userLocation via closure — recreated when userLocation changes
  const addDist = useCallback(
    (i) => ({
      ...i,
      views: i.views ?? 0,
      distance: getDistanceFromLatLonInKm(
        userLocation.lat,
        userLocation.lng,
        i.lat,
        i.lng,
      ),
    }),
    [userLocation.lat, userLocation.lng],
  );

  // Splash — once per session
  const [showSplash, setShowSplash] = useState(() => {
    try {
      return !sessionStorage.getItem("na-splash-done");
    } catch (_) {
      return true;
    }
  });
  const handleSplashDone = useCallback(() => {
    try {
      sessionStorage.setItem("na-splash-done", "1");
    } catch (_) {
      _;
    }
    setShowSplash(false);
  }, []);

  // Data
  const [allIncidents, setAllIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [search] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [mapCommand, setMapCommand] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [successAnim, setSuccessAnim] = useState(null);
  const [heatmapActive, setHeatmapActive] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  const scrollRef = useRef(null);
  const toastTimer = useRef(null);
  const initialFitDone = useRef(false);

  // Toast
  const showToast = useCallback((msg, type = "success") => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // Initial fetch
  useEffect(() => {
    setLoading(true);
    incidentsAPI
      .getNearby(userLocation.lat, userLocation.lng)
      .then(({ data }) => {
        const incidents = sortNew(data.incidents.map(addDist));
        setAllIncidents(incidents);

        // Set initial map view to fit all incidents + user + 5km circle
        if (!initialFitDone.current && incidents.length > 0) {
          initialFitDone.current = true;
          setMapCommand(
            mkInitialFit(userLocation.lat, userLocation.lng, incidents),
          );
        }
      })
      .catch(() => showToast("Failed to load incidents", "error"))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  // Re-compute distances when GPS resolves
  useEffect(() => {
    if (locStatus === "granted" && allIncidents.length > 0) {
      setAllIncidents((prev) => sortNew(prev.map(addDist)));
    }
  }, [locStatus, addDist]); // eslint-disable-line

  // Derived lists
  const nearby = useMemo(
    () => allIncidents.filter((i) => i.distance <= RADIUS_KM),
    [allIncidents],
  );
  const filtered = useMemo(() => {
    if (!search.trim()) return nearby;
    const q = search.toLowerCase();
    return nearby.filter(
      (i) =>
        i.title.toLowerCase().includes(q) || i.type.toLowerCase().includes(q),
    );
  }, [nearby, search]);

  // Views
  const incrementViews = useCallback((id) => {
    setAllIncidents((prev) =>
      prev.map((i) => (i.id === id ? { ...i, views: (i.views ?? 0) + 1 } : i)),
    );
  }, []);

  // Handlers
  // Eye button: direct focus mode — zoom to marker with high zoom level
  const handlePreview = useCallback(
    (incident) => {
      if (!incident?.lat || !incident?.lng) return;
      incrementViews(incident.id);
      setSelectedId(incident.id);
      setMapCommand(mkFlyTo(incident.lat, incident.lng, 17)); // Safe zoom for inspection
      setSidebarOpen(false);
    },
    [incrementViews],
  );

  // Marker click: smooth flyTo from current position to incident
  const handleMarkerClick = useCallback(
    (id) => {
      setSelectedId(id);
      incrementViews(id);
      const inc = nearby.find((i) => i.id === id);
      if (inc) {
        // Smooth fly animation from current position to incident
        setMapCommand(mkFlyTo(inc.lat, inc.lng, 17));
      }
      requestAnimationFrame(() =>
        document
          .getElementById(`incident-${id}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" }),
      );
    },
    [incrementViews, nearby],
  );

  // Sidebar click: fitBounds between user and selected incident
  const handleSidebarSelect = useCallback(
    (id) => {
      setSelectedId(id);
      incrementViews(id);
      const inc = nearby.find((i) => i.id === id);
      if (inc) setMapCommand(mkFitBounds(inc.lat, inc.lng));
      setSidebarOpen(false);
    },
    [nearby, incrementViews],
  );

  const handleCreate = useCallback(
    async (payload) => {
      try {
        const { data } = await incidentsAPI.create({
          ...payload,
          userId: liveUser.id ?? CURRENT_USER.id,
          userName: liveUser.name ?? CURRENT_USER.name,
          views: 0,
          lat: payload.lat ?? userLocation.lat,
          lng: payload.lng ?? userLocation.lng,
        });
        const withDist = addDist(data.incident);
        setAllIncidents((prev) => sortNew([withDist, ...prev]));
        setShowModal(false);
        setSelectedId(withDist.id);
        setMapCommand(mkFitBounds(withDist.lat, withDist.lng));
        setSuccessAnim({ type: withDist.type });
        setTimeout(
          () => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" }),
          150,
        );
      } catch {
        showToast("Failed to report incident", "error");
      }
    },
    [showToast, addDist, userLocation, liveUser],
  );

  // ─── RENDER ────────────────────────────────────────────────────────────────
  // NO wrapper dark div — ThemeContext handles dark on <html>
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white dark:bg-na-navy">
      {showSplash && <SplashScreen onDone={handleSplashDone} />}
      {successAnim && (
        <ReportSuccessAnimation
          type={successAnim.type}
          onDone={() => setSuccessAnim(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[9998] px-5 py-3 rounded-xl shadow-2xl
            flex items-center gap-3 text-white text-sm font-semibold
            ${toast.type === "success" ? "bg-emerald-500" : "bg-red-500"}`}
          style={{
            animation: "naSlideIn 0.28s cubic-bezier(.22,.68,0,1.2) both",
          }}
        >
          {toast.type === "success" ? (
            <CheckCircle size={18} />
          ) : (
            <AlertTriangle size={18} />
          )}
          {toast.msg}
        </div>
      )}

      {!bannerDismissed && (
        <LocationPermissionBanner onDismiss={() => setBannerDismissed(true)} />
      )}

      {/* ══════════════════════════════════════════════════════════════════
          HEADER
          ══════════════════════════════════════════════════════════════════ */}
      <header
        className="
        shrink-0 relative flex items-center h-[60px] px-4
        bg-white dark:bg-na-surface
        border-b border-gray-100 dark:border-na-border
        shadow-sm
      "
      >
        {/* LEFT — hamburger */}
        <div className="flex items-center gap-2 z-10">
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="md:hidden p-2 rounded-xl
              text-gray-500 dark:text-slate-300
              hover:bg-gray-100 dark:hover:bg-na-hover
              active:scale-95 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* CENTER — always pixel-centered using absolute positioning */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
          <h1
            className="
            text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight leading-none
            bg-gradient-to-r from-blue-600 via-blue-500 to-violet-600
            bg-clip-text text-transparent
          "
          >
            Neighbour Alert
          </h1>
          <p className="hidden sm:block text-[10px] md:text-[11px] text-gray-400 dark:text-slate-500 mt-0.5 font-medium tracking-widest uppercase">
            Community Safety Network
          </p>
        </div>

        {/* RIGHT — analytics + theme toggle + avatar */}
        <div className="ml-auto flex items-center gap- sm:gap-2 z-10">
          {" "}
          {/* Analytics Button */}
          <button
            onClick={() => setAnalyticsOpen((o) => !o)}
            className={`
              p-0 rounded-xl transition-all duration-200 active:scale-95
              ${
                analyticsOpen
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-na-hover"
              }
            `}
            title="View analytics"
          >
            <BarChart3 size={20} />
          </button>
          <ThemeToggle />
          <button
            onClick={() => navigate("/profile")}
            className="
              w-9 h-9 rounded-full
              bg-gradient-to-br from-blue-500 to-violet-600
              text-white font-bold text-sm
              flex items-center justify-center
              ring-2 ring-white dark:ring-na-border
              hover:scale-110 hover:shadow-lg active:scale-95
              transition-all duration-200
            "
            title="View profile"
          >
            {liveUser.name.charAt(0)}
          </button>
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 relative overflow-hidden">
        <SidebarComponent
          incidents={filtered}
          selectedId={selectedId}
          onSelect={handleSidebarSelect}
          onPreview={handlePreview}
          scrollRef={scrollRef}
          loading={loading}
          query={search}
          totalNearby={nearby.length}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          heatmapActive={heatmapActive}
          onHeatmapToggle={() => setHeatmapActive((h) => !h)}
        />

        <div className="flex-1 relative min-w-0">
          <CrimeMap
            incidents={nearby}
            selectedId={selectedId}
            onSelect={handleMarkerClick}
            mapCommand={mapCommand}
            dark={dark}
            userLocation={userLocation}
            heatmapActive={heatmapActive}
          />
          <FloatingAddButton onClick={() => setShowModal(true)} />
        </div>

        {/* Analytics Panel */}
        <AnalyticsPanel
          incidents={nearby}
          open={analyticsOpen}
          onClose={() => setAnalyticsOpen(false)}
          radius={RADIUS_KM}
        />
      </div>

      {showModal && (
        <CreatePostModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}

      <style>{`
        @keyframes naSlideIn {
          from { opacity:0; transform:translateX(48px) scale(.94); }
          to   { opacity:1; transform:translateX(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
