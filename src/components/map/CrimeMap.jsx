import { useEffect, useRef, memo, useMemo, useCallback, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Circle,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed } from "lucide-react";
import { getRoute } from "../../services/routingService";
import { getDistanceFromLatLonInKm } from "../../utils/haversine";

const DEFAULT_USER_LOC = Object.freeze([24.944922, 67.038815]);

// Routing is fixed to driving directions — the cycling/walking mode
// switcher (and its per-mode distance/duration math that used to live in
// services/routingService.js) has been removed. See chat notes for what
// still needs trimming inside that file.
const TRAVEL_MODE = "driving";

// ─── Config ───────────────────────────────────────────────────────────────────
const RADIUS_M = 5000;
const DEF_ZOOM = 13;
const INITIAL_FIT_ZOOM = 15;
const FIT_DUR = 1.6;
const FIT_PAD = [120, 120];
const FIT_MAX_Z = 16;
const FLY_DUR = 1.8;
const FLY_EASE = 0.22;
const FLY_ZOOM = 17;
const MAX_SAFE_ZOOM = 18;

// ─── Route draw-in animation tuning ────────────────────────────────────────────
const ROUTE_ANIM_MIN_MS = 900;
const ROUTE_ANIM_MAX_MS = 2600;
const ROUTE_ANIM_MS_PER_KM = 350;
const ROUTE_CAMERA_WAIT_FALLBACK_MS = FLY_DUR * 1000 + 150;

const TILES = {
  light: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
};
const TILE_ATTR = {
  light: "© OpenStreetMap",
  dark: "© OpenStreetMap © CartoDB",
};

const CIRCLE_OPT = Object.freeze({
  color: "#3b82f6",
  fillColor: "#3b82f6",
  fillOpacity: 0.05,
  weight: 2,
  dashArray: "8 6",
  lineCap: "round",
});

const BAND = {
  green: {
    fill: "#16a34a",
    stroke: "#15803d",
    shadow: "rgba(22,163,74,0.45)",
    wave: "#16a34a",
  },
  orange: {
    fill: "#ea580c",
    stroke: "#c2410c",
    shadow: "rgba(234,88,12,0.45)",
    wave: "#ea580c",
  },
  red: {
    fill: "#dc2626",
    stroke: "#b91c1c",
    shadow: "rgba(220,38,38,0.45)",
    wave: "#dc2626",
  },
};
const bandOf = (km) => (km <= 1 ? "green" : km <= 3 ? "orange" : "red");

// ─── Icon cache ───────────────────────────────────────────────────────────────
const _pins = {};
const _waves = {};

const makePinIcon = (band, selected) => {
  const key = `${band}-${selected}`;
  if (_pins[key]) return _pins[key];
  const { fill, stroke } = BAND[band];
  const W = selected ? 34 : 26,
    H = selected ? 48 : 38;
  const r = selected ? 12 : 9,
    cx = W / 2,
    cy = r + 2;
  const p = `M ${cx},${H} C ${cx - W * 0.15},${H * 0.7} 0,${cy + r * 1.4} 0,${cy} A ${cx},${cy} 0 0 1 ${W},${cy} C ${W},${cy + r * 1.4} ${cx + W * 0.15},${H * 0.7} ${cx},${H} Z`;
  _pins[key] = new L.DivIcon({
    html: `<div class="na-pin${selected ? " na-pin--selected" : ""}" style="width:${W}px;height:${H}px">
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        <defs><filter id="pf-${key}" x="-50%" y="-30%" width="200%" height="180%">
          <feDropShadow dx="0" dy="${selected ? 4 : 2.5}" stdDeviation="${selected ? 4 : 2.5}" flood-color="${BAND[band].shadow}" flood-opacity="0.9"/>
        </filter></defs>
        <path d="${p}" fill="${fill}" stroke="${stroke}" stroke-width="${selected ? 1.5 : 1}" filter="url(#pf-${key})"/>
        ${
          selected
            ? `<circle cx="${cx}" cy="${cy}" r="${r - 2}" fill="white" opacity="0.92"/><circle cx="${cx}" cy="${cy}" r="${r - 5}" fill="${fill}"/>`
            : `<circle cx="${cx}" cy="${cy}" r="${r - 2.5}" fill="white" opacity="0.88"/>`
        }
      </svg></div>`,
    className: "na-pin-outer",
    iconSize: [W, H],
    iconAnchor: [cx, H],
    popupAnchor: [0, -(H + 6)],
  });
  return _pins[key];
};

const makeWaveIcon = (band) => {
  if (_waves[band]) return _waves[band];
  const c = BAND[band].wave;
  _waves[band] = new L.DivIcon({
    className: "na-wave-outer",
    html: `<div class="na-waves">
      <span class="na-wave w1" style="border-color:${c}"></span>
      <span class="na-wave w2" style="border-color:${c}"></span>
      <span class="na-wave w3" style="border-color:${c}"></span>
    </div>`,
    iconSize: [76, 76],
    iconAnchor: [38, 38],
  });
  return _waves[band];
};

const USER_ICON = L.divIcon({
  className: "na-user-outer",
  html: `<div class="na-user">
    <span class="na-user-ring r1"></span>
    <span class="na-user-ring r2"></span>
    <div class="na-user-dot"></div>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -24],
});

// ─── Route geometry helpers ─────────────────────────────────────────────────
function buildCumulativeDistances(coords) {
  const dists = [0];
  for (let i = 1; i < coords.length; i++) {
    const [lat1, lng1] = coords[i - 1];
    const [lat2, lng2] = coords[i];
    dists.push(
      dists[i - 1] + getDistanceFromLatLonInKm(lat1, lng1, lat2, lng2),
    );
  }
  return dists;
}

function interpolateAlong(coords, cum, total, t) {
  const target = total * Math.max(0, Math.min(1, t));
  if (target <= 0) return [coords[0]];
  if (target >= total) return coords;

  let idx = 1;
  while (idx < cum.length && cum[idx] < target) idx++;
  const segStart = cum[idx - 1];
  const segEnd = cum[idx];
  const segT =
    segEnd === segStart ? 0 : (target - segStart) / (segEnd - segStart);
  const [lat1, lng1] = coords[idx - 1];
  const [lat2, lng2] = coords[idx];
  const lat = lat1 + (lat2 - lat1) * segT;
  const lng = lng1 + (lng2 - lng1) * segT;
  return [...coords.slice(0, idx), [lat, lng]];
}

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

// ─── Canvas Heatmap Layer ─────────────────────────────────────────────────────
function HeatmapLayer({ incidents, uLoc }) {
  const map = useMap();
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!incidents.length) return;

    const CanvasLayer = L.Layer.extend({
      onAdd(m) {
        this._map = m;
        const pane = m.getPane("overlayPane");
        this._canvas = L.DomUtil.create(
          "canvas",
          "leaflet-heatmap-canvas",
          pane,
        );
        this._canvas.style.pointerEvents = "none";
        this._canvas.style.position = "absolute";
        this._canvas.style.left = "0";
        this._canvas.style.top = "0";
        m.on("moveend zoomend resize", this._draw, this);
        this._draw();
      },
      onRemove(m) {
        m.off("moveend zoomend resize", this._draw, this);
        L.DomUtil.remove(this._canvas);
      },
      _draw() {
        const m = this._map;
        const size = m.getSize();
        const canvas = this._canvas;
        canvas.width = size.x;
        canvas.height = size.y;

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, size.x, size.y);

        const WEIGHT = {
          Robbery: 1,
          Assault: 1,
          Snatching: 0.85,
          Harassment: 0.75,
          Burglary: 0.7,
          Theft: 0.55,
          Vandalism: 0.35,
          "Lost Item": 0.1,
          "Item Found": 0,
        };

        for (const inc of incidents) {
          const pt = m.latLngToContainerPoint([inc.lat, inc.lng]);
          const w = WEIGHT[inc.type] ?? 0.4;
          const ageHrs =
            (Date.now() - new Date(inc.createdAt ?? 0)) / 3_600_000;
          const recency = Math.max(0.3, 1 - ageHrs / 48);
          const weight = w * recency;
          if (weight < 0.05) continue;

          const baseR = 40 + m.getZoom() * 4;
          const grad = ctx.createRadialGradient(
            pt.x,
            pt.y,
            0,
            pt.x,
            pt.y,
            baseR,
          );
          grad.addColorStop(0, `rgba(239,68,68,${0.55 * weight})`);
          grad.addColorStop(0.4, `rgba(245,158,11,${0.35 * weight})`);
          grad.addColorStop(0.7, `rgba(59,130,246,${0.18 * weight})`);
          grad.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, baseR, 0, Math.PI * 2);
          ctx.fill();
        }

        const topLeft = m.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(canvas, topLeft);
      },
    });

    const layer = new CanvasLayer();
    canvasRef.current = layer;
    layer.addTo(map);

    return () => {
      layer.remove();
      canvasRef.current = null;
    };
  }, [incidents, map, uLoc]);

  return null;
}

// ─── UserLayer ────────────────────────────────────────────────────────────────
function UserLayer({ userLocation }) {
  const pos = [userLocation.lat, userLocation.lng];
  return (
    <>
      <Circle center={pos} radius={RADIUS_M} pathOptions={CIRCLE_OPT} />
      <Marker position={pos} icon={USER_ICON} zIndexOffset={3000}>
        <Popup closeButton={false} autoClose={false} closeOnClick={false}>
          <div style={{ minWidth: 140 }}>
            <p style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>
              📍 You are here
            </p>
            <p style={{ fontSize: 11, margin: "4px 0 0", opacity: 0.6 }}>
              {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
            </p>
          </div>
        </Popup>
      </Marker>
    </>
  );
}

// ─── AutoOpenUserPopup ────────────────────────────────────────────────────────
function AutoOpenUserPopup({ userLocation }) {
  const map = useMap();
  const firedRef = useRef(false);
  const locKey = `${userLocation.lat}-${userLocation.lng}`;
  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    const t = setTimeout(() => {
      map.eachLayer((layer) => {
        if (!(layer instanceof L.Marker)) return;
        const p = layer.getLatLng();
        if (
          Math.abs(p.lat - userLocation.lat) < 0.001 &&
          Math.abs(p.lng - userLocation.lng) < 0.001
        ) {
          try {
            layer.openPopup();
          } catch (_) {
            _;
          }
        }
      });
    }, 900);
    return () => clearTimeout(t);
  }, [locKey, map, userLocation.lat, userLocation.lng]);
  return null;
}

// ─── MapResizeHandler ─────────────────────────────────────────────────────────
// Mobile browsers change the *actual* viewport height as the user
// touches/scrolls (the address bar/toolbar collapses or re-appears).
// Dashboard.jsx sizes the map's container with `100dvh`, which correctly
// tracks that — but Leaflet has no idea the container resized unless
// something tells it to. Its internal pixel-origin/size cache goes stale,
// so panes/tiles/markers get positioned against the OLD size until
// something forces a recalculation. That staleness is what reads as "the
// map refreshing," and it's also what can push the user marker outside
// the area Leaflet currently thinks is visible.
//
// Fix: watch the actual container element with a ResizeObserver (same
// pattern already used in AnimatedBackground.jsx for its canvas) and also
// watch window.visualViewport, the most reliable resize signal on iOS
// Safari specifically. invalidateSize({ animate:false, pan:false }) so it
// re-measures without fighting any in-progress flyTo/fitBounds.
function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;

    let rafId = null;
    const invalidate = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = null;
        map.invalidateSize({ animate: false, pan: false });
      });
    };

    const ro = new ResizeObserver(invalidate);
    ro.observe(container);

    const vv = window.visualViewport;
    vv?.addEventListener("resize", invalidate);

    return () => {
      ro.disconnect();
      vv?.removeEventListener("resize", invalidate);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [map]);

  return null;
}

// ─── MapCommandController ─────────────────────────────────────────────────────
function MapCommandController({ cmd, userLocation, incidents }) {
  const map = useMap();
  const keyRef = useRef(null);

  useEffect(() => {
    if (!cmd) return;
    const key = `${cmd.type}-${cmd.triggeredAt}`;
    if (keyRef.current === key) return;
    keyRef.current = key;

    if (cmd.type === "flyTo") {
      const tz = cmd.zoom ?? FLY_ZOOM;
      map.flyTo([cmd.lat, cmd.lng], tz, {
        duration: FLY_DUR,
        easeLinearity: FLY_EASE,
      });
    } else if (cmd.type === "fitBounds") {
      const uLoc = userLocation ?? {
        lat: DEFAULT_USER_LOC[0],
        lng: DEFAULT_USER_LOC[1],
      };
      map.fitBounds(
        L.latLngBounds([
          L.latLng(uLoc.lat, uLoc.lng),
          L.latLng(cmd.lat, cmd.lng),
        ]),
        {
          paddingTopLeft: [90, 190],
          paddingBottomRight: [90, 90],
          maxZoom: FIT_MAX_Z,
          animate: true,
          duration: FIT_DUR,
          easeLinearity: 0.2,
        },
      );
    } else if (cmd.type === "initialFit") {
      const uLoc = userLocation ?? {
        lat: DEFAULT_USER_LOC[0],
        lng: DEFAULT_USER_LOC[1],
      };
      const nearbyIncidents = cmd.incidents ?? [];

      if (nearbyIncidents.length === 0) {
        map.setView([uLoc.lat, uLoc.lng], INITIAL_FIT_ZOOM, { animate: true });
      } else {
        const bounds = L.latLngBounds([
          L.latLng(uLoc.lat, uLoc.lng),
          ...nearbyIncidents.map((inc) => L.latLng(inc.lat, inc.lng)),
        ]);

        map.fitBounds(bounds, {
          padding: FIT_PAD,
          maxZoom: INITIAL_FIT_ZOOM,
          animate: true,
          duration: 1.2,
        });
      }
    } else if (cmd.type === "resetView") {
      map.setView([userLocation.lat, userLocation.lng], DEF_ZOOM, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [cmd, map, userLocation, incidents]);

  return null;
}

// ─── PopupController ──────────────────────────────────────────────────────────
// Opens the selected incident's popup once RouteLine reports the draw-in
// animation has arrived (routeDoneSignal), with a timeout fallback for
// paths that never produce a route (heatmap mode, a failed fetch).
//
// Positioning is left entirely to Leaflet's own built-in autoPan (see the
// autoPan* props on the incident <Popup> below) instead of a hand-rolled
// getBoundingClientRect()+panBy() correction — see the explanation above
// this file for why that combination was the actual bug.
function PopupController({ selectedId, markersRef, routeDoneSignal }) {
  const prevIdRef = useRef(null);
  const prevMkrRef = useRef(null);
  const fallbackTimerRef = useRef(null);
  const openedKeyRef = useRef(null);

  const openPopupSafely = useCallback((mkr) => {
    try {
      const p = mkr.getPopup();
      if (!p) return;
      p.options.autoClose = false;
      p.options.closeOnClick = false;
      mkr.openPopup();
    } catch (_) {}
  }, []);

  // Close old popup / arm fallback whenever selection changes.
  useEffect(() => {
    if (selectedId === prevIdRef.current) return;
    prevIdRef.current = selectedId;

    if (prevMkrRef.current) {
      try {
        prevMkrRef.current.closePopup();
      } catch (_) {}
    }
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }

    if (!selectedId) return;
    const mkr = markersRef.current[selectedId];
    if (!mkr) return;
    prevMkrRef.current = mkr;

    fallbackTimerRef.current = setTimeout(() => {
      fallbackTimerRef.current = null;
      openPopupSafely(mkr);
    }, ROUTE_CAMERA_WAIT_FALLBACK_MS + ROUTE_ANIM_MAX_MS);

    return () => {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };
  }, [selectedId, markersRef, openPopupSafely]);

  // Open immediately once RouteLine reports the draw-in animation arrived.
  useEffect(() => {
    if (!routeDoneSignal || routeDoneSignal.id !== selectedId) return;
    const key = `${routeDoneSignal.id}-${routeDoneSignal.at}`;
    if (openedKeyRef.current === key) return;
    openedKeyRef.current = key;

    const mkr = markersRef.current[routeDoneSignal.id];
    if (!mkr) return;

    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    openPopupSafely(mkr);
  }, [routeDoneSignal, selectedId, markersRef, openPopupSafely]);

  return null;
}

// ─── RouteLine ────────────────────────────────────────────────────────────────
function RouteLine({ incident, userLocation, onInfo, onArrived }) {
  const map = useMap();
  const [fullCoords, setFullCoords] = useState([]);
  const [drawnCoords, setDrawnCoords] = useState([]);

  const keyRef = useRef(null);
  const reportedRef = useRef(false);
  const arrivedForRef = useRef(null);
  const abortRef = useRef(null);
  const rafRef = useRef(null);
  const cameraWaitCleanupRef = useRef(null);

  const stopAnimation = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const clearCameraWait = useCallback(() => {
    if (cameraWaitCleanupRef.current) {
      cameraWaitCleanupRef.current();
      cameraWaitCleanupRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!incident) {
      stopAnimation();
      clearCameraWait();
      if (abortRef.current) abortRef.current.abort();
      setFullCoords([]);
      setDrawnCoords([]);
      keyRef.current = null;
      return;
    }

    const key = incident.id;
    if (keyRef.current === key) return;
    keyRef.current = key;
    reportedRef.current = false;
    arrivedForRef.current = null;

    if (abortRef.current) abortRef.current.abort();
    stopAnimation();
    clearCameraWait();
    setFullCoords([]);
    setDrawnCoords([]);

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let cancelled = false;

    const uLat = userLocation?.lat ?? DEFAULT_USER_LOC[0];
    const uLng = userLocation?.lng ?? DEFAULT_USER_LOC[1];

    const runAnimation = (coords, cum, total) => {
      if (cancelled) return;
      const durationMs = Math.min(
        ROUTE_ANIM_MAX_MS,
        Math.max(ROUTE_ANIM_MIN_MS, total * ROUTE_ANIM_MS_PER_KM),
      );
      let startTs = null;

      const step = (ts) => {
        if (cancelled) return;
        if (startTs === null) startTs = ts;
        const rawT = Math.min(1, (ts - startTs) / durationMs);
        const t = easeOutCubic(rawT);
        setDrawnCoords(interpolateAlong(coords, cum, total, t));

        if (rawT < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          rafRef.current = null;
          if (arrivedForRef.current !== key) {
            arrivedForRef.current = key;
            onArrived?.(incident.id);
          }
        }
      };
      rafRef.current = requestAnimationFrame(step);
    };

    const waitForCameraThenAnimate = (coords, cum, total) => {
      let started = false;

      const onMoveEnd = () => {
        if (started || cancelled) return;
        started = true;
        cameraWaitCleanupRef.current = null;
        runAnimation(coords, cum, total);
      };

      const fallback = setTimeout(() => {
        if (started || cancelled) return;
        started = true;
        map.off("moveend", onMoveEnd);
        cameraWaitCleanupRef.current = null;
        runAnimation(coords, cum, total);
      }, ROUTE_CAMERA_WAIT_FALLBACK_MS);

      map.once("moveend", onMoveEnd);

      cameraWaitCleanupRef.current = () => {
        map.off("moveend", onMoveEnd);
        clearTimeout(fallback);
      };
    };

    getRoute({
      from: { lat: uLat, lng: uLng },
      to: { lat: incident.lat, lng: incident.lng },
      mode: TRAVEL_MODE,
      signal: ctrl.signal,
    })
      .then((route) => {
        if (cancelled) return;
        const coords = route.coordinates;
        setFullCoords(coords);

        if (!reportedRef.current) {
          reportedRef.current = true;
          onInfo?.({
            distance: route.distanceKm.toFixed(2),
            duration: Math.max(1, Math.round(route.durationMin)),
            estimated: route.estimated,
          });
        }

        const cum = buildCumulativeDistances(coords);
        const total = cum[cum.length - 1] || 0;

        if (total <= 0 || coords.length < 2) {
          setDrawnCoords(coords);
          if (arrivedForRef.current !== key) {
            arrivedForRef.current = key;
            onArrived?.(incident.id);
          }
          return;
        }

        waitForCameraThenAnimate(coords, cum, total);
      })
      .catch((err) => {
        if (err.name === "AbortError" || cancelled) return;
        const straight = [
          [uLat, uLng],
          [incident.lat, incident.lng],
        ];
        setFullCoords(straight);
        setDrawnCoords(straight);
        if (arrivedForRef.current !== key) {
          arrivedForRef.current = key;
          onArrived?.(incident.id);
        }
      });

    return () => {
      cancelled = true;
      stopAnimation();
      clearCameraWait();
    };
  }, [
    incident.id,
    userLocation?.lat,
    userLocation?.lng,
    onInfo,
    onArrived,
    map,
    stopAnimation,
    clearCameraWait,
    incident,
  ]);

  useEffect(() => {
    return () => {
      stopAnimation();
      clearCameraWait();
      if (abortRef.current) abortRef.current.abort();
    };
  }, [stopAnimation, clearCameraWait]);

  if (fullCoords.length < 2) return null;

  return (
    <>
      <Polyline
        positions={fullCoords}
        pathOptions={{
          color: "#93c5fd",
          weight: 3,
          opacity: 0.35,
          lineCap: "round",
          lineJoin: "round",
          dashArray: "2 10",
        }}
        interactive={false}
      />

      {drawnCoords.length >= 2 && (
        <>
          <Polyline
            positions={drawnCoords}
            pathOptions={{
              color: "#1d4ed8",
              weight: 14,
              opacity: 0.12,
              lineCap: "round",
              lineJoin: "round",
            }}
            interactive={false}
          />
          <Polyline
            positions={drawnCoords}
            pathOptions={{
              color: "#3b82f6",
              weight: 5,
              opacity: 1,
              lineCap: "round",
              lineJoin: "round",
            }}
            interactive={false}
          />
        </>
      )}
    </>
  );
}

// ─── ResetViewButton ──────────────────────────────────────────────────────────
function ResetViewButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="absolute top-20 right-4 z-[999] w-10 h-10 rounded-lg bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110 active:scale-95"
      title="Reset to your location"
    >
      <LocateFixed className="w-5 h-5" />
    </button>
  );
}

// ─── CrimeMap ─────────────────────────────────────────────────────────────────
function CrimeMap({
  incidents = [],
  selectedId,
  onSelect,
  mapCommand,
  dark = false,
  userLocation = null,
  heatmapActive = false,
}) {
  const markersRef = useRef({});
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeDoneSignal, setRouteDoneSignal] = useState(null);
  const [resetCmd, setResetCmd] = useState(null);
  const handleRouteInfo = useCallback((info) => setRouteInfo(info), []);
  const handleRouteArrived = useCallback((id) => {
    setRouteDoneSignal({ id, at: Date.now() });
  }, []);

  useEffect(() => {
    setRouteInfo(null);
  }, [selectedId]);

  const uLoc = useMemo(
    () =>
      userLocation ?? { lat: DEFAULT_USER_LOC[0], lng: DEFAULT_USER_LOC[1] },
    [userLocation],
  );

  const meta = useMemo(
    () =>
      incidents.map((i) => {
        const km =
          Math.sqrt((uLoc.lat - i.lat) ** 2 + (uLoc.lng - i.lng) ** 2) * 111;
        return { ...i, _km: km, _band: bandOf(km) };
      }),
    [incidents, uLoc],
  );

  const selected = useMemo(
    () => meta.find((i) => i.id === selectedId) ?? null,
    [meta, selectedId],
  );

  const tileUrl = dark ? TILES.dark : TILES.light;
  const tileAttr = dark ? TILE_ATTR.dark : TILE_ATTR.light;

  const handleResetView = useCallback(() => {
    setResetCmd({ type: "resetView", triggeredAt: Date.now() });
  }, []);

  const activeCommand = useMemo(() => {
    if (!resetCmd) return mapCommand;
    if (!mapCommand) return resetCmd;
    return mapCommand.triggeredAt > resetCmd.triggeredAt
      ? mapCommand
      : resetCmd;
  }, [resetCmd, mapCommand]);

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={[uLoc.lat, uLoc.lng]}
        zoom={INITIAL_FIT_ZOOM}
        maxZoom={MAX_SAFE_ZOOM}
        minZoom={10}
        className="h-full w-full"
        key="na-crime-map"
        zoomControl
        preferCanvas={true}
        // See MapResizeHandler comment above for why this is disabled —
        // it's a legacy 300ms-click-delay workaround that's redundant on
        // modern mobile browsers and a known source of ghost taps right
        // after a marker's icon swaps size on selection.
        tap={false}
      >
        <TileLayer
          key={tileUrl}
          url={tileUrl}
          attribution={tileAttr}
          maxNativeZoom={19}
          maxZoom={MAX_SAFE_ZOOM}
        />

        <UserLayer userLocation={uLoc} />
        <AutoOpenUserPopup userLocation={uLoc} />
        <MapResizeHandler />
        <MapCommandController
          cmd={activeCommand}
          userLocation={uLoc}
          incidents={meta}
        />
        <PopupController
          selectedId={selectedId}
          markersRef={markersRef}
          routeDoneSignal={routeDoneSignal}
        />

        {heatmapActive && <HeatmapLayer incidents={meta} uLoc={uLoc} />}

        {!heatmapActive &&
          meta.map((i) => {
            const isSel = i.id === selectedId;
            const dist =
              isSel && routeInfo
                ? `${routeInfo.distance} km`
                : `${i._km.toFixed(1)} km`;
            const dur =
              isSel && routeInfo ? `~${routeInfo.duration} min` : null;
            return (
              <div key={i.id}>
                <Marker
                  position={[i.lat, i.lng]}
                  icon={makeWaveIcon(i._band)}
                  zIndexOffset={-1000}
                  interactive={false}
                />
                <Marker
                  position={[i.lat, i.lng]}
                  icon={makePinIcon(i._band, isSel)}
                  zIndexOffset={isSel ? 2500 : 1000}
                  eventHandlers={{ click: () => onSelect?.(i.id) }}
                  ref={(r) => {
                    if (r) markersRef.current[i.id] = r;
                  }}
                >
                  <Popup
                    autoPan={true}
                    autoPanPaddingTopLeft={[20, 90]}
                    autoPanPaddingBottomRight={[20, 90]}
                  >
                    <div style={{ minWidth: 195 }}>
                      <p
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          lineHeight: 1.35,
                          margin: 0,
                        }}
                      >
                        {i.title}
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          margin: "5px 0 0",
                          opacity: 0.62,
                          lineHeight: 1.45,
                        }}
                      >
                        {i.description}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          marginTop: 9,
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#2563eb",
                        }}
                      >
                        <span>📍 {dist}</span>
                        {dur && <span>🕐 {dur}</span>}
                        <span
                          style={{
                            marginLeft: "auto",
                            color: "#94a3b8",
                            fontWeight: 400,
                          }}
                        >
                          👁 {i.views ?? 0}
                        </span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </div>
            );
          })}

        {!heatmapActive && selected && (
          <RouteLine
            incident={selected}
            userLocation={uLoc}
            onInfo={handleRouteInfo}
            onArrived={handleRouteArrived}
          />
        )}
      </MapContainer>

      <ResetViewButton onClick={handleResetView} />

      {heatmapActive && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[999] pointer-events-none">
          <div className="bg-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2">
            <span>🔥</span> Heatmap Mode — crime density view
          </div>
        </div>
      )}

      {!heatmapActive && selected && routeInfo && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[999] pointer-events-none"
          style={{
            animation: "slideUp 0.35s cubic-bezier(.22,.68,0,1.2) both",
          }}
        >
          <div
            className="
              bg-blue-600 text-white font-semibold
              rounded-full shadow-2xl flex items-center
              px-3 py-1.5 text-xs gap-2
              sm:px-5 sm:py-2.5 sm:text-sm sm:gap-3
            "
          >
            <span>
              🚗 {routeInfo.estimated ? "~" : ""}
              {routeInfo.distance} km
            </span>
            <span className="hidden xs:block opacity-30">|</span>
            <span>🕐 ~{routeInfo.duration} min</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(CrimeMap);
