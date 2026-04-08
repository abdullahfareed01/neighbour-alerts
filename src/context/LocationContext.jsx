/**
 * context/LocationContext.jsx
 * Manages the user's geolocation with full permission-state handling.
 *
 * States: idle | loading | granted | denied | unavailable
 *
 * Falls back to DHA Karachi if permission denied.
 * Exposes `requestLocation()` so the UI can re-prompt.
 */
import { createContext, useContext, useState, useCallback, useEffect } from "react";

export const DEFAULT_LOCATION = { lat: 24.944922, lng: 67.038815 };

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [status,   setStatus]   = useState("idle");   // idle|loading|granted|denied|unavailable
  const [location, setLocation] = useState(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("unavailable");
      setLocation(DEFAULT_LOCATION);
      return;
    }

    setStatus("loading");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: parseFloat(pos.coords.latitude.toFixed(6)),
          lng: parseFloat(pos.coords.longitude.toFixed(6)),
        });
        setStatus("granted");
      },
      () => {
        setLocation(DEFAULT_LOCATION);
        setStatus("denied");
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }
    );
  }, []);

  // Auto-request on mount
  useEffect(() => { requestLocation(); }, [requestLocation]);

  return (
    <LocationContext.Provider value={{ status, location, requestLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export const useLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used inside LocationProvider");
  return ctx;
};