/**
 * components/ui/LocationPermissionBanner.jsx
 * Shown at top of Dashboard when GPS permission is denied.
 * Non-blocking — app continues to work with fallback coordinates.
 */
import { MapPin, X, RefreshCw } from "lucide-react";
import { useLocation } from "../../context/LocationContext";

export default function LocationPermissionBanner({ onDismiss }) {
  const { requestLocation, status } = useLocation();

  if (status !== "denied" && status !== "unavailable") return null;

  return (
    <div className="shrink-0 bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-700 px-4 py-2.5 flex items-center gap-3 text-sm">
      <MapPin size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="font-semibold text-amber-800 dark:text-amber-300">
          {status === "unavailable" ? "Location not supported" : "Location access denied"}
        </span>
        <span className="text-amber-700 dark:text-amber-400 ml-1.5 hidden sm:inline">
          — using default location. To fix:
          <span className="font-medium"> browser address bar → 🔒 → Location → Allow</span>
        </span>
      </div>
      {status === "denied" && (
        <button
          onClick={requestLocation}
          className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-200 dark:bg-amber-800 hover:bg-amber-300 dark:hover:bg-amber-700 px-3 py-1.5 rounded-lg transition-colors"
        >
          <RefreshCw size={12} />
          Retry
        </button>
      )}
      <button
        onClick={onDismiss}
        className="shrink-0 p-1 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800 rounded transition-colors"
      >
        <X size={15} />
      </button>
    </div>
  );
}