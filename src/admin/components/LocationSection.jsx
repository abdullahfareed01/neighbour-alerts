/**
 * admin/components/LocationSection.jsx
 *
 * "Future-friendly" location display for the incident detail page.
 * Deliberately does NOT render any map widget — Phase 3 explicitly
 * excludes the admin map (that's a later phase, and this must not
 * duplicate the user-facing CrimeMap). This only shows the structured
 * data an eventual map integration would consume (coordinates + a
 * reported-area label) plus a plain external link out to Google Maps,
 * which is just a hyperlink, not a map implementation.
 */
import { MapPin, LocateFixed } from "lucide-react";

export default function LocationSection({ incident }) {
  const hasCoords =
    typeof incident?.lat === "number" && typeof incident?.lng === "number";
  const mapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${incident.lat},${incident.lng}`
    : null;

  return (
    <div className="bg-white dark:bg-na-surface rounded-2xl p-4 border border-gray-100 dark:border-na-border shadow-sm">
      <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 mb-3 flex items-center gap-2">
        <MapPin size={16} className="text-blue-600 dark:text-blue-400" />
        Location
      </h3>

      <div className="space-y-3">
        {incident?.locationLabel && (
          <div>
            <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">
              Reported area
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-slate-100">
              {incident.locationLabel}
            </p>
          </div>
        )}

        <div>
          <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">
            Coordinates
          </p>
          <p className="text-sm font-mono text-gray-700 dark:text-slate-300">
            {hasCoords
              ? `${incident.lat.toFixed(6)}, ${incident.lng.toFixed(6)}`
              : "Not available"}
          </p>
        </div>

        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold
              text-blue-600 dark:text-blue-400
              hover:bg-blue-50 dark:hover:bg-blue-900/25
              px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <LocateFixed size={13} />
            Open in Google Maps
          </a>
        )}

        <p className="text-[11px] text-gray-400 dark:text-slate-500 pt-2 border-t border-gray-100 dark:border-na-border leading-relaxed">
          An interactive admin map with category/severity/status filtering
          is planned for a later phase (see CLAUDE.md's roadmap) — this
          section will link into it once it exists.
        </p>
      </div>
    </div>
  );
}
