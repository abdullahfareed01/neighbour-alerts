/**
 * CreatePostModal.jsx
 * Dark mode: relies on <html class="dark">. Uses na-* token palette.
 */
import { useState, useEffect, useRef } from "react";
import { X, MapPin, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { DEFAULT_LOCATION } from "../../context/LocationContext";

const INCIDENT_TYPES = [
  { label:"Theft",      emoji:"💰", color:"bg-amber-50  dark:bg-amber-900/30  text-amber-700  dark:text-amber-300  border-amber-300  dark:border-amber-700"  },
  { label:"Robbery",    emoji:"🔫", color:"bg-red-50    dark:bg-red-900/30    text-red-700    dark:text-red-300    border-red-300    dark:border-red-700"    },
  { label:"Assault",    emoji:"🚨", color:"bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700" },
  { label:"Burglary",   emoji:"🏠", color:"bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700" },
  { label:"Vandalism",  emoji:"🔨", color:"bg-blue-50   dark:bg-blue-900/30   text-blue-700   dark:text-blue-300   border-blue-300   dark:border-blue-700"   },
  { label:"Lost Item",  emoji:"📦", color:"bg-sky-50    dark:bg-sky-900/30    text-sky-700    dark:text-sky-300    border-sky-300    dark:border-sky-700"    },
  { label:"Item Found", emoji:"✅", color:"bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700" },
  { label:"Snatching",  emoji:"🏃", color:"bg-pink-50   dark:bg-pink-900/30   text-pink-700   dark:text-pink-300   border-pink-300   dark:border-pink-700"   },
  { label:"Harassment", emoji:"⚠️", color:"bg-rose-50   dark:bg-rose-900/30   text-rose-700   dark:text-rose-300   border-rose-300   dark:border-rose-700"   },
];

const TITLE_MAX = 80;
const DESC_MAX  = 300;

export default function CreatePostModal({ onClose, onCreate }) {
  const [form,       setForm]       = useState({ title: "", type: "Theft", description: "" });
  const [errors,     setErrors]     = useState({});
  const [gps,        setGps]        = useState(null);
  const [gpsStatus,  setGpsStatus]  = useState("loading");
  const [gpsLabel,   setGpsLabel]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const titleRef = useRef(null);

  useEffect(() => { setTimeout(() => titleRef.current?.focus(), 80); }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGps(DEFAULT_LOCATION); setGpsStatus("error");
      setGpsLabel("Geolocation unavailable — using default");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const lat = parseFloat(p.coords.latitude.toFixed(6));
        const lng = parseFloat(p.coords.longitude.toFixed(6));
        setGps({ lat, lng }); setGpsStatus("success");
        setGpsLabel(`${lat}, ${lng}`);
      },
      () => {
        setGps(DEFAULT_LOCATION); setGpsStatus("error");
        setGpsLabel("Location denied — using default");
      },
      { timeout: 9000, maximumAge: 60000, enableHighAccuracy: true }
    );
  }, []);

  const sel = INCIDENT_TYPES.find((t) => t.label === form.type);

  const validate = () => {
    const e = {};
    if (!form.title.trim())           e.title = "Title is required";
    else if (form.title.length > TITLE_MAX) e.title = `Max ${TITLE_MAX} chars`;
    if (!form.description.trim())     e.description = "Description is required";
    else if (form.description.length > DESC_MAX) e.description = `Max ${DESC_MAX} chars`;
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 300));
    onCreate({
      id:          `local-${Date.now()}`,
      type:        form.type,
      title:       form.title.trim(),
      description: form.description.trim(),
      lat:         gps?.lat ?? DEFAULT_LOCATION.lat,
      lng:         gps?.lng ?? DEFAULT_LOCATION.lng,
      views:       0,
      createdAt:   new Date().toISOString(),
    });
    setSubmitting(false);
  };

  const set = (field, val) => {
    setForm((p) => ({ ...p, [field]: val }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: null }));
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="relative w-full sm:max-w-lg
          bg-white dark:bg-na-surface
          rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden
          max-h-[92vh] flex flex-col
          border-0 dark:border dark:border-na-border"
        style={{ animation: "modalIn 0.28s cubic-bezier(.22,.68,0,1.2) both" }}
      >
        {/* Accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-blue-600 to-violet-600 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3
          border-b border-gray-100 dark:border-na-border shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Report an Incident</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Help your neighbours stay safe</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full
              text-gray-400 dark:text-slate-500
              hover:text-gray-700 dark:hover:text-slate-200
              hover:bg-gray-100 dark:hover:bg-na-hover
              transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
          {/* GPS pill */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border ${
            gpsStatus === "success"
              ? "bg-green-50 dark:bg-green-900/25 border-green-200 dark:border-green-700 text-green-700 dark:text-green-400"
              : gpsStatus === "loading"
              ? "bg-blue-50 dark:bg-blue-900/25 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400"
              : "bg-amber-50 dark:bg-amber-900/25 border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-400"
          }`}>
            {gpsStatus === "loading" ? <Loader2 size={13} className="animate-spin shrink-0" />
              : gpsStatus === "success" ? <CheckCircle2 size={13} className="shrink-0" />
              : <AlertCircle size={13} className="shrink-0" />}
            <MapPin size={13} className="shrink-0" />
            <span className="truncate">{gpsStatus === "loading" ? "Getting location…" : gpsLabel}</span>
          </div>

          {/* Type grid */}
          <div>
            <p className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              Incident type
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {INCIDENT_TYPES.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => set("type", t.label)}
                  className={`flex items-center gap-1 px-2 py-2 rounded-lg border text-[11px] font-semibold transition-all ${
                    form.type === t.label
                      ? `${t.color} ring-2 ring-offset-1 ring-blue-400 dark:ring-blue-500 scale-[1.02]`
                      : "bg-gray-50 dark:bg-na-hover border-gray-200 dark:border-na-border text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-600"
                  }`}
                >
                  <span style={{ fontSize: 13 }}>{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              ref={titleRef}
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Wallet snatched near Dolmen Mall"
              maxLength={TITLE_MAX}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm
                bg-gray-50 dark:bg-na-input
                text-gray-900 dark:text-slate-100
                placeholder-gray-400 dark:placeholder-slate-500
                focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                transition-colors
                ${errors.title ? "border-red-400 bg-red-50 dark:bg-red-900/20" : "border-gray-200 dark:border-na-border hover:border-gray-300 dark:hover:border-slate-600"}`}
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-red-500">{errors.title || ""}</span>
              <span className={`text-xs ${form.title.length > TITLE_MAX * 0.9 ? "text-orange-500" : "text-gray-400 dark:text-slate-500"}`}>
                {form.title.length}/{TITLE_MAX}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
              What happened? <span className="text-red-400">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Describe the incident clearly…"
              rows={3}
              maxLength={DESC_MAX}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm
                bg-gray-50 dark:bg-na-input
                text-gray-900 dark:text-slate-100
                placeholder-gray-400 dark:placeholder-slate-500
                resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                transition-colors
                ${errors.description ? "border-red-400 bg-red-50 dark:bg-red-900/20" : "border-gray-200 dark:border-na-border hover:border-gray-300 dark:hover:border-slate-600"}`}
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-red-500">{errors.description || ""}</span>
              <span className={`text-xs ${form.description.length > DESC_MAX * 0.9 ? "text-orange-500" : "text-gray-400 dark:text-slate-500"}`}>
                {form.description.length}/{DESC_MAX}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border
                border-gray-200 dark:border-na-border
                text-sm font-semibold
                text-gray-600 dark:text-slate-300
                hover:bg-gray-50 dark:hover:bg-na-hover
                active:scale-[.98] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || gpsStatus === "loading"}
              className="flex-1 py-2.5 rounded-xl
                bg-gradient-to-r from-blue-600 to-blue-700
                hover:from-blue-700 hover:to-blue-800
                text-white text-sm font-semibold shadow-md
                disabled:opacity-60 disabled:cursor-not-allowed
                active:scale-[.98] transition-all flex items-center justify-center gap-2"
            >
              {submitting
                ? <><Loader2 size={15} className="animate-spin" />Reporting…</>
                : <><span style={{ fontSize: 15 }}>{sel?.emoji}</span>Report Incident</>
              }
            </button>
          </div>
        </form>

        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: scale(.93) translateY(12px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );
}