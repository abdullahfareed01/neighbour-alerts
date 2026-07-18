/**
 * admin/components/ConfirmDialog.jsx
 * Generic confirmation modal for destructive or irreversible admin
 * actions (Reject an incident, Delete an incident). Visual shell follows
 * the same conventions already used by
 * components/CreatePost/CreatePostModal.jsx (fixed inset-0 backdrop blur,
 * rounded card, accent bar) so it feels like part of the same app rather
 * than a one-off pattern.
 *
 * Controlled component: the parent owns `open` state and passes
 * onConfirm/onCancel. `loading` disables both buttons while the mock
 * async action (see admin/services/adminApi.js) is in flight.
 */
import { AlertTriangle, Loader2 } from "lucide-react";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && !loading && onCancel?.()}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="relative w-full max-w-sm
          bg-white dark:bg-na-surface
          rounded-2xl shadow-2xl overflow-hidden
          border-0 dark:border dark:border-na-border"
        style={{ animation: "scaleIn 0.22s cubic-bezier(.22,.68,0,1.2) both" }}
      >
        <div
          className={`h-1 w-full shrink-0 ${
            danger
              ? "bg-gradient-to-r from-red-500 via-red-600 to-rose-600"
              : "bg-gradient-to-r from-blue-500 via-blue-600 to-violet-600"
          }`}
        />

        <div className="p-5 flex flex-col items-center text-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              danger
                ? "bg-red-50 dark:bg-red-900/25 text-red-600 dark:text-red-400"
                : "bg-blue-50 dark:bg-blue-900/25 text-blue-600 dark:text-blue-400"
            }`}
          >
            <AlertTriangle size={22} />
          </div>

          <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">
            {title}
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
            {message}
          </p>

          <div className="flex gap-3 w-full mt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl border
                border-gray-200 dark:border-na-border
                text-sm font-semibold
                text-gray-600 dark:text-slate-300
                hover:bg-gray-50 dark:hover:bg-na-hover
                disabled:opacity-50 disabled:cursor-not-allowed
                active:scale-[.98] transition-all"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm
                disabled:opacity-60 disabled:cursor-not-allowed
                active:scale-[.98] transition-all flex items-center justify-center gap-2
                ${
                  danger
                    ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
                    : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                }`}
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
