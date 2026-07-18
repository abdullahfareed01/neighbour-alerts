/**
 * admin/components/Toast.jsx
 * Small fixed toast bar for confirming admin actions (status changed,
 * incident deleted, errors, ...). Same success/error color + icon
 * language as the toast already used in pages/Dashboard.jsx, extracted
 * here so AdminIncidents.jsx and AdminIncidentDetail.jsx don't each
 * duplicate the markup. Uses the "animate-slideInRight" keyframe that's
 * already global (defined once in App.css) instead of adding a new one.
 */
import { CheckCircle, AlertTriangle } from "lucide-react";

export default function Toast({ toast }) {
  if (!toast) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-[9998] px-5 py-3 rounded-xl shadow-2xl
        flex items-center gap-3 text-white text-sm font-semibold
        animate-slideInRight
        ${toast.type === "error" ? "bg-red-500" : "bg-emerald-500"}`}
    >
      {toast.type === "error" ? (
        <AlertTriangle size={18} />
      ) : (
        <CheckCircle size={18} />
      )}
      {toast.message}
    </div>
  );
}
