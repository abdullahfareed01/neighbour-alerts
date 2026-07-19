/**
 * admin/components/IncidentActions.jsx
 *
 * SINGLE SOURCE OF TRUTH for "what admin actions exist on an incident and
 * what happens when you trigger them" — used in two places:
 *   - layout="menu"    → compact control embedded in an IncidentTable row
 *   - layout="buttons" → full-size buttons on the incident detail page
 *
 * This component does NOT talk to adminApi.js directly. It receives
 * `onStatusChange(id, status)` and `onDelete(id)` callbacks from the
 * parent page, which are the ones that actually call adminApi and show a
 * toast — IncidentActions only owns the UI/UX rules: which transitions
 * need a confirmation dialog first (Reject, Delete — see CONFIRM_REQUIRED
 * below), per-button busy states, and disabling a status button that
 * matches the incident's current status.
 *
 * Because ConfirmDialog is rendered *inside* this component, both
 * IncidentTable rows and the detail page get Reject/Delete confirmation
 * automatically without either page having to manage that dialog's state
 * itself.
 *
 * Icon choices are limited to names already proven to exist in this
 * project's pinned lucide-react version (see IncidentTable.jsx's header
 * comment for why) — no MoreVertical/Trash2/Filter here.
 */
import { useState } from "react";
import { Search, ShieldCheck, CheckCircle2, X, Loader2 } from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";
import { STATUS_VALUES, STATUS_LABEL } from "../constants/incidentStatus";

const ACTION_DEFS = [
  { status: "under_review", label: "Mark Under Review", icon: Search, tone: "blue" },
  { status: "verified", label: "Verify", icon: ShieldCheck, tone: "violet" },
  { status: "resolved", label: "Resolve", icon: CheckCircle2, tone: "emerald" },
  { status: "rejected", label: "Reject", icon: X, tone: "red" },
];

const TONE_CLASS = {
  blue: "bg-blue-50 dark:bg-blue-900/25 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 border-blue-200 dark:border-blue-800",
  violet: "bg-violet-50 dark:bg-violet-900/25 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/40 border-violet-200 dark:border-violet-800",
  emerald: "bg-emerald-50 dark:bg-emerald-900/25 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800",
  red: "bg-red-50 dark:bg-red-900/25 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border-red-200 dark:border-red-800",
};

// Status transitions destructive/irreversible-feeling enough to confirm
// first. Delete always confirms too (handled separately below).
const CONFIRM_REQUIRED_STATUSES = new Set(["rejected"]);

export default function IncidentActions({
  incident,
  layout = "buttons",
  onStatusChange,
  onDelete,
  allowDelete = true,
}) {
  const [pending, setPending] = useState(null); // "status:<value>" | "delete" | null
  const [confirmTarget, setConfirmTarget] = useState(null); // { kind: "status", status } | { kind: "delete" }
  const busy = pending !== null;

  const runStatusChange = async (status) => {
    setPending(`status:${status}`);
    try {
      await onStatusChange?.(incident.id, status);
    } catch (_) {
      // The parent is responsible for surfacing the error (toast). We
      // just need to not leave an unhandled rejection behind, since this
      // is invoked from a fire-and-forget click handler below.
    } finally {
      setPending(null);
      setConfirmTarget(null);
    }
  };

  const runDelete = async () => {
    setPending("delete");
    try {
      await onDelete?.(incident.id);
    } catch (_) {
      // see note in runStatusChange
    } finally {
      setPending(null);
      setConfirmTarget(null);
    }
  };

  const requestStatusChange = (status) => {
    if (busy || status === incident.status) return;
    if (CONFIRM_REQUIRED_STATUSES.has(status)) {
      setConfirmTarget({ kind: "status", status });
    } else {
      runStatusChange(status);
    }
  };

  const requestDelete = () => {
    if (!busy) setConfirmTarget({ kind: "delete" });
  };

  const dialog = (() => {
    if (!confirmTarget) return null;
    if (confirmTarget.kind === "delete") {
      return {
        title: "Delete this incident?",
        message: `"${incident.title}" will be permanently removed from the system. This can't be undone.`,
        confirmLabel: "Delete incident",
        onConfirm: runDelete,
      };
    }
    return {
      title: "Reject this incident?",
      message: `"${incident.title}" will be marked as rejected. You can change its status again later if needed.`,
      confirmLabel: "Reject incident",
      onConfirm: () => runStatusChange(confirmTarget.status),
    };
  })();

  return (
    <>
      {layout === "menu" ? (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <select
            value={incident.status}
            disabled={busy}
            onChange={(e) => requestStatusChange(e.target.value)}
            title="Change status"
            className="text-[11px] font-semibold pl-2 pr-1 py-1.5 rounded-lg border
              bg-gray-50 dark:bg-na-input text-gray-600 dark:text-slate-300
              border-gray-200 dark:border-na-border
              hover:bg-white dark:hover:bg-na-hover
              focus:outline-none focus:border-blue-400
              disabled:opacity-50 transition-colors max-w-[112px]"
          >
            {STATUS_VALUES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>

          {allowDelete && (
            <button
              type="button"
              onClick={requestDelete}
              disabled={busy}
              title="Delete incident"
              className="p-1.5 rounded-lg text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/25 active:scale-90 disabled:opacity-40 transition-all"
            >
              {pending === "delete" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <X size={14} />
              )}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {ACTION_DEFS.map(({ status, label, icon: Icon, tone }) => {
              const isCurrent = incident.status === status;
              const isPending = pending === `status:${status}`;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => requestStatusChange(status)}
                  disabled={busy || isCurrent}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all active:scale-[.98] disabled:cursor-not-allowed ${
                    isCurrent
                      ? "bg-gray-50 dark:bg-na-hover text-gray-400 dark:text-slate-500 border-gray-200 dark:border-na-border opacity-70"
                      : `${TONE_CLASS[tone]} disabled:opacity-50`
                  }`}
                >
                  {isPending ? <Loader2 size={15} className="animate-spin" /> : <Icon size={15} />}
                  {isCurrent ? "Current status" : label}
                </button>
              );
            })}
          </div>

          {allowDelete && (
            <button
              type="button"
              onClick={requestDelete}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold
                text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800
                hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-[.98]
                disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {pending === "delete" && <Loader2 size={15} className="animate-spin" />}
              Delete Incident
            </button>
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(dialog)}
        title={dialog?.title}
        message={dialog?.message}
        confirmLabel={dialog?.confirmLabel}
        cancelLabel="Cancel"
        danger
        loading={busy}
        onConfirm={dialog?.onConfirm}
        onCancel={() => !busy && setConfirmTarget(null)}
      />
    </>
  );
}
