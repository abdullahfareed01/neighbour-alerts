/**
 * services/routingService.js
 *
 * Thin, provider-agnostic routing abstraction used by CrimeMap's RouteLine.
 * Callers only depend on the shape returned by getRoute() — swapping OSRM
 * for Mapbox/Google Directions/a self-hosted OSRM later only means editing
 * this file, not CrimeMap.jsx.
 *
 * NOTE: the public OSRM demo server (router.project-osrm.org) only hosts
 * the "driving" profile. Walking/cycling requests fall back to a
 * straight-line distance/time estimate (flagged via `estimated: true`)
 * so the UI stays useful instead of breaking. This is NOT fake traffic
 * data — it's a clearly-labeled straight-line estimate. Point this at a
 * self-hosted OSRM (with walking/cycling profiles enabled) or another
 * provider to get real routed walking/cycling directions.
 */
import { getDistanceFromLatLonInKm } from "../utils/haversine";

export const TRAVEL_MODES = {
  driving: {
    label: "Drive",
    icon: "🚗",
    osrmProfile: "driving",
    avgSpeedKmh: 35,
  },
  walking: {
    label: "Walk",
    icon: "🚶",
    osrmProfile: "walking",
    avgSpeedKmh: 5,
  },
  cycling: {
    label: "Cycle",
    icon: "🚴",
    osrmProfile: "cycling",
    avgSpeedKmh: 15,
  },
};

const OSRM_BASE = "https://router.project-osrm.org/route/v1";

// Profiles actually served by the public OSRM demo instance.
const OSRM_SUPPORTED_PROFILES = new Set(["driving"]);

/**
 * @param {{ from: {lat,lng}, to: {lat,lng}, mode?: keyof TRAVEL_MODES, signal?: AbortSignal }} params
 * @returns {Promise<{ coordinates: [number,number][], distanceKm: number, durationMin: number, estimated: boolean }>}
 */
export async function getRoute({ from, to, mode = "driving", signal }) {
  const modeCfg = TRAVEL_MODES[mode] ?? TRAVEL_MODES.driving;
  const profile = modeCfg.osrmProfile;

  if (OSRM_SUPPORTED_PROFILES.has(profile)) {
    const url = `${OSRM_BASE}/${profile}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&alternatives=false&continue_straight=false&annotations=false`;

    try {
      const res = await fetch(url, { signal });
      const data = await res.json();
      if (data.code === "Ok" && data.routes?.length) {
        const coordinates = data.routes[0].geometry.coordinates.map(
          ([lng, lat]) => [lat, lng],
        );
        return {
          coordinates,
          distanceKm: data.routes[0].distance / 1000,
          durationMin: data.routes[0].duration / 60,
          estimated: false,
        };
      }
    } catch (err) {
      if (err.name === "AbortError") throw err;
      // fall through to the estimate below
    }
  }

  // Fallback: profile not served by OSRM demo, or the request failed —
  // return a straight-line estimate instead of leaving the UI empty.
  const distanceKm = getDistanceFromLatLonInKm(
    from.lat,
    from.lng,
    to.lat,
    to.lng,
  );
  return {
    coordinates: [
      [from.lat, from.lng],
      [to.lat, to.lng],
    ],
    distanceKm,
    durationMin: (distanceKm / modeCfg.avgSpeedKmh) * 60,
    estimated: true,
  };
}
