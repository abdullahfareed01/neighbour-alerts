/**
 * admin/components/UserActions.jsx
 *
 * SINGLE SOURCE OF TRUTH for "what admin actions exist on a user account
 * and what happens when you trigger them" — mirrors
 * admin/components/IncidentActions.jsx's structure exactly:
 *   - layout="menu"    → compact control embedded in a UserTable row
 *   - layout="buttons" → full-size button on the user detail page
 *
 * Only two account states exist (active/suspended — see
 * constants/userStatus.js), so unlike IncidentActions' multi-option
 * <select>, this renders a single toggle action: Suspend when active,
 * Restore when suspended.
 *
 * This component does NOT talk to adminApi.js directly. It receives
 * `onSuspend(id)` / `onRestore(id)` callbacks from the parent page, which
 * are the ones that actually call adminApi and show a toast —
 * UserActions only owns the UI/UX rule that matters here: Suspend is
 * impactful enough to confirm first (it blocks the account), Restore is
 * not (reversible, non-destructive), exactly the same asymmetry
 * IncidentActions applies to Reject vs. the other status changes.
 *
 * Account deletion is intentionally NOT implemented in this phase.
 *
 * Icon choices (ShieldAlert, RefreshCw, Eye, Loader2) are limited to
 * names already proven to exist in this project's pinned lucide-react
 * version — see IncidentActions.jsx's header for why that matters here.
 */
import { useState } from "react";
import { ShieldAlert, RefreshCw, Loader2 } from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";

export default function UserActions({
  user,
  layout = "buttons",
  onSuspend,
  onRestore,
}) {
  const [pending, setPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isSuspended = user.status === "suspended";

  const runSuspend = async () => {
    setPending(true);
    try {
      await onSuspend?.(user.id);
    } catch (_) {
      // Parent surfaces the error via toast; just don't leave an
      // unhandled rejection behind (fire-and-forget click handler).
    } finally {
      setPending(false);
      setConfirmOpen(false);
    }
  };

  const runRestore = async () => {
    setPending(true);
    try {
      await onRestore?.(user.id);
    } catch (_) {
      // see note in runSuspend
    } finally {
      setPending(false);
    }
  };

  const handleClick = () => {
    if (pending) return;
    if (isSuspended) {
      runRestore();
    } else {
      setConfirmOpen(true);
    }
  };

  if (layout === "menu") {
    return (
      <>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          disabled={pending}
          title={isSuspended ? "Restore account" : "Suspend account"}
          className={[
            "flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
            isSuspended
              ? "bg-emerald-50 dark:bg-emerald-900/25 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-900/25 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border-red-200 dark:border-red-800",
          ].join(" ")}
        >
          {pending ? (
            <Loader2 size={13} className="animate-spin" />
          ) : isSuspended ? (
            <RefreshCw size={13} />
          ) : (
            <ShieldAlert size={13} />
          )}
          {isSuspended ? "Restore" : "Suspend"}
        </button>

        <ConfirmDialog
          open={confirmOpen}
          title="Suspend this account?"
          message={`"${user.name}" will lose access until an admin restores the account. This can be undone at any time.`}
          confirmLabel="Suspend account"
          cancelLabel="Cancel"
          danger
          loading={pending}
          onConfirm={runSuspend}
          onCancel={() => !pending && setConfirmOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all active:scale-[.98] disabled:opacity-60 disabled:cursor-not-allowed ${
          isSuspended
            ? "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white border-transparent shadow-sm"
            : "text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
        }`}
      >
        {pending ? (
          <Loader2 size={15} className="animate-spin" />
        ) : isSuspended ? (
          <RefreshCw size={15} />
        ) : (
          <ShieldAlert size={15} />
        )}
        {isSuspended ? "Restore Account" : "Suspend Account"}
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title="Suspend this account?"
        message={`"${user.name}" will lose access until an admin restores the account. This can be undone at any time.`}
        confirmLabel="Suspend account"
        cancelLabel="Cancel"
        danger
        loading={pending}
        onConfirm={runSuspend}
        onCancel={() => !pending && setConfirmOpen(false)}
      />
    </>
  );
}
