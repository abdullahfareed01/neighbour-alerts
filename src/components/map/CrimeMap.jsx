

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

const DEFAULT_USER_LOC = Object.freeze([24.944922, 67.038815]);

// ─── Config ───────────────────────────────────────────────────────────────────
const RADIUS_M = 5000;
const DEF_ZOOM = 15;
const FIT_DUR = 1.6;
const FIT_PAD = [120, 120]; // Increased padding for better visibility
const FIT_MAX_Z = 16; // Slightly lower max zoom for fitBounds
// FlyTo config
const FLY_DUR = 1.8;
const FLY_EASE = 0.25; // Lower = smoother easing (0.25 works well with Leaflet)
const FLY_ZOOM = 17; // Safe zoom level to prevent white screen
const MAX_SAFE_ZOOM = 18; // Absolute maximum to prevent tile loading issues

const TILES = {
  light: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  dark: "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
};
const TILE_ATTR = {
  light: "© OpenStreetMap",
  dark: "© OpenStreetMap © CARTO",
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
  iconSize: [56, 56],
  iconAnchor: [28, 28],
  popupAnchor: [0, -32],
});

// ─── Tile warmer ──────────────────────────────────────────────────────────────
function warmTiles(tileUrl, lat, lng, zoom) {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const y = Math.floor(
    ((1 - Math.log((1 + sinLat) / (1 - sinLat)) / (2 * Math.PI)) / 2) * n,
  );
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const url = tileUrl
        .replace("{z}", zoom)
        .replace("{x}", x + dx)
        .replace("{y}", y + dy)
        .replace("{s}", "a")
        .replace("{r}", "");
      new Image().src = url;
    }
  }
}

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

// ─── MapCommandController ─────────────────────────────────────────────────────
function MapCommandController({ cmd, userLocation, tileUrl, incidents }) {
  const map = useMap();
  const keyRef = useRef(null);

  useEffect(() => {
    if (!cmd) return;
    const key = `${cmd.type}-${cmd.triggeredAt}`;
    if (keyRef.current === key) return;
    keyRef.current = key;

    if (cmd.type === "flyTo") {
      const tz = cmd.zoom ?? FLY_ZOOM;
      warmTiles(tileUrl, cmd.lat, cmd.lng, tz);
      warmTiles(tileUrl, cmd.lat, cmd.lng, tz - 1);
      map.flyTo([cmd.lat, cmd.lng], tz, {
        duration: FLY_DUR,
        easeLinearity: FLY_EASE,
      });
    } else if (cmd.type === "fitBounds") {
      const uLoc = userLocation ?? {
        lat: DEFAULT_USER_LOC[0],
        lng: DEFAULT_USER_LOC[1],
      };
      warmTiles(
        tileUrl,
        (uLoc.lat + cmd.lat) / 2,
        (uLoc.lng + cmd.lng) / 2,
        FIT_MAX_Z,
      );
      warmTiles(
        tileUrl,
        (uLoc.lat + cmd.lat) / 2,
        (uLoc.lng + cmd.lng) / 2,
        FIT_MAX_Z - 1,
      );
      map.fitBounds(
        L.latLngBounds([
          L.latLng(uLoc.lat, uLoc.lng),
          L.latLng(cmd.lat, cmd.lng),
        ]),
        {
          padding: FIT_PAD,
          maxZoom: FIT_MAX_Z,
          animate: true,
          duration: FIT_DUR,
          easeLinearity: 0.2,
        },
      );
    } else if (cmd.type === "initialFit") {
      // Initial fit: include user + all incidents + 5km circle
      const uLoc = userLocation ?? {
        lat: DEFAULT_USER_LOC[0],
        lng: DEFAULT_USER_LOC[1],
      };

      const allPoints = [
        L.latLng(uLoc.lat, uLoc.lng),
        ...cmd.incidents.map((inc) => L.latLng(inc.lat, inc.lng)),
      ];

      // Add circle boundary points (approximate)
      const R_DEG = RADIUS_M / 111000; // rough km to degrees
      allPoints.push(
        L.latLng(uLoc.lat + R_DEG, uLoc.lng),
        L.latLng(uLoc.lat - R_DEG, uLoc.lng),
        L.latLng(uLoc.lat, uLoc.lng + R_DEG),
        L.latLng(uLoc.lat, uLoc.lng - R_DEG),
      );

      const bounds = L.latLngBounds(allPoints);

      map.fitBounds(bounds, {
        padding: FIT_PAD,
        maxZoom: 14, // Lower max zoom for initial overview
        animate: true,
        duration: 1.2,
      });
    }
  }, [cmd, map, userLocation, tileUrl, incidents]);

  return null;
}

// ─── PopupController ──────────────────────────────────────────────────────────
// Enhanced popup controller with offset to prevent overflow
function PopupController({ selectedId, markersRef }) {
  const map = useMap();
  const prevIdRef = useRef(null);
  const prevMkrRef = useRef(null);

  useEffect(() => {
    if (selectedId === prevIdRef.current) return;
    prevIdRef.current = selectedId;

    if (prevMkrRef.current) {
      try {
        prevMkrRef.current.closePopup();
      } catch (_) {}
    }

    if (!selectedId) return;
    const mkr = markersRef.current[selectedId];
    if (!mkr) return;
    prevMkrRef.current = mkr;

    // Wait for map movement to complete before opening popup
    const openPopupSafely = () => {
      try {
        const p = mkr.getPopup();
        if (p) {
          p.options.autoClose = false;
          p.options.closeOnClick = false;
          // Add offset to prevent overflow at top
          p.options.offset = L.point(0, -10);
          mkr.openPopup();

          // Pan map slightly if popup would overflow
          setTimeout(() => {
            const markerPos = mkr.getLatLng();
            const pixelPos = map.latLngToContainerPoint(markerPos);
            const mapSize = map.getSize();

            // If marker is too close to top, pan down slightly
            if (pixelPos.y < 150) {
              const newCenter = map.containerPointToLatLng([
                mapSize.x / 2,
                mapSize.y / 2 + 50,
              ]);
              map.panTo(newCenter, { animate: true, duration: 0.3 });
            }
          }, 100);
        }
      } catch (_) {}
    };

    setTimeout(openPopupSafely, FIT_DUR * 1000 + 200);
  }, [selectedId, markersRef, map]);

  return null;
}

// ─── RouteLine ────────────────────────────────────────────────────────────────
// Enhanced: only draws route AFTER map movement completes
function RouteLine({ incident, userLocation, onInfo }) {
  const map = useMap();
  const [drawn, setDrawn] = useState([]);
  const [coords, setCoords] = useState([]);
  const [mapMoving, setMapMoving] = useState(false);
  const prevIdRef = useRef(null);
  const reportedRef = useRef(false);
  const rafRef = useRef(null);
  const timerRef = useRef(null);
  const abortRef = useRef(null);

  // Track map movement
  useEffect(() => {
    const onMoveStart = () => setMapMoving(true);
    const onMoveEnd = () => setMapMoving(false);

    map.on("movestart zoomstart", onMoveStart);
    map.on("moveend zoomend", onMoveEnd);

    return () => {
      map.off("movestart zoomstart", onMoveStart);
      map.off("moveend zoomend", onMoveEnd);
    };
  }, [map]);

  // Fetch route
  useEffect(() => {
    if (!incident) {
      setDrawn([]);
      setCoords([]);
      prevIdRef.current = null;
      return;
    }
    if (prevIdRef.current === incident.id) return;
    prevIdRef.current = incident.id;
    reportedRef.current = false;

    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const uLat = userLocation?.lat ?? DEFAULT_USER_LOC[0];
    const uLng = userLocation?.lng ?? DEFAULT_USER_LOC[1];
    const url = `https://router.project-osrm.org/route/v1/driving/${uLng},${uLat};${incident.lng},${incident.lat}?overview=full&geometries=geojson&alternatives=false&continue_straight=false&annotations=false`;

    fetch(url, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => {
        if (d.code === "Ok" && d.routes?.length) {
          const pts = d.routes[0].geometry.coordinates.map(([lng, lat]) => [
            lat,
            lng,
          ]);
          setCoords(pts);
          if (!reportedRef.current) {
            reportedRef.current = true;
            onInfo?.({
              distance: (d.routes[0].distance / 1000).toFixed(2),
              duration: Math.round(d.routes[0].duration / 60),
            });
          }
        } else {
          setCoords([
            [uLat, uLng],
            [incident.lat, incident.lng],
          ]);
          setDrawn([
            [uLat, uLng],
            [incident.lat, incident.lng],
          ]);
        }
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setCoords([
          [uLat, uLng],
          [incident.lat, incident.lng],
        ]);
        setDrawn([
          [uLat, uLng],
          [incident.lat, incident.lng],
        ]);
      });

    return () => ctrl.abort();
  }, [incident?.id, userLocation?.lat, userLocation?.lng, onInfo]); // eslint-disable-line

  // Animate route drawing ONLY when map is not moving
  useEffect(() => {
    if (!coords.length || mapMoving) {
      // Clear route while map is moving
      setDrawn([]);
      return;
    }

    if (coords.length === 2) {
      setDrawn(coords);
      return;
    }

    // Start animation after map settles
    setDrawn([coords[0]]);
    let t0 = null;
    const DUR = 1800;

    const tick = (now) => {
      if (!t0) t0 = now;
      const p = Math.min((now - t0) / DUR, 1);
      const e = 1 - Math.pow(1 - p, 3);
      const r = e * (coords.length - 1);
      const i = Math.floor(r),
        j = Math.min(i + 1, coords.length - 1);
      const s = r % 1;
      const a = coords[i],
        b = coords[j];
      setDrawn([
        ...coords.slice(0, i),
        [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s],
      ]);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else setDrawn(coords);
    };

    timerRef.current = setTimeout(() => {
      rafRef.current = requestAnimationFrame(tick);
    }, 300);

    return () => {
      clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [coords, mapMoving]);

  if (drawn.length < 2) return null;

  return (
    <>
      <Polyline
        positions={drawn}
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
        positions={drawn}
        pathOptions={{
          color: "#3b82f6",
          weight: 5,
          opacity: 1,
          lineCap: "round",
          lineJoin: "round",
        }}
        interactive={false}
      />
      <Polyline
        positions={drawn}
        pathOptions={{
          color: "#93c5fd",
          weight: 2,
          opacity: 0.65,
          lineCap: "round",
          dashArray: "2 14",
        }}
        interactive={false}
      />
    </>
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
  const handleRouteInfo = useCallback((info) => setRouteInfo(info), []);

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

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={[uLoc.lat, uLoc.lng]}
        zoom={DEF_ZOOM}
        maxZoom={MAX_SAFE_ZOOM}
        minZoom={10}
        className="h-full w-full"
        key="na-crime-map"
        keepBuffer={4}
        zoomControl
        preferCanvas={true}
      >
        <TileLayer
          key={tileUrl}
          url={tileUrl}
          attribution={tileAttr}
          detectRetina
          updateWhenIdle={false}
          updateWhenZooming={false}
          keepBuffer={4}
        />

        <UserLayer userLocation={uLoc} />
        <AutoOpenUserPopup userLocation={uLoc} />
        <MapCommandController
          cmd={mapCommand}
          userLocation={uLoc}
          tileUrl={tileUrl}
          incidents={meta}
        />
        <PopupController selectedId={selectedId} markersRef={markersRef} />

        {/* Heatmap layer — only rendered when active */}
        {heatmapActive && <HeatmapLayer incidents={meta} uLoc={uLoc} />}

        {/* Incident markers — hidden in heatmap mode */}
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
                  <Popup>
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

        {/* Route — only in marker mode and only when map is not moving */}
        {!heatmapActive && selected && (
          <RouteLine
            incident={selected}
            userLocation={uLoc}
            onInfo={handleRouteInfo}
          />
        )}
      </MapContainer>

      {/* Heatmap mode label */}
      {heatmapActive && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[999] pointer-events-none">
          <div className="bg-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2">
            <span>🔥</span> Heatmap Mode — crime density view
          </div>
        </div>
      )}

      {/* Route info pill */}
      {!heatmapActive && selected && routeInfo && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[999] pointer-events-none"
          style={{
            animation: "slideUp 0.35s cubic-bezier(.22,.68,0,1.2) both",
          }}
        >
          <div className="bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-3">
            <span>📍 {routeInfo.distance} km</span>
            <span className="opacity-30">|</span>
            <span>🕐 ~{routeInfo.duration} min</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(CrimeMap);
