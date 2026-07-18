/**
 * admin/components/LoadingState.jsx
 * Generic centered loading indicator, reused across admin pages/sections.
 * Same Loader2-spin convention already used in AdminLogin.jsx and
 * CreatePostModal.jsx, so it feels consistent with the rest of the app
 * instead of introducing a new loading pattern.
 */
import { Loader2 } from "lucide-react";

export default function LoadingState({ label = "Loading…", className = "" }) {
  return (
    <div
      className={`flex items-center justify-center gap-2 py-20 text-gray-400 dark:text-slate-500 text-sm ${className}`}
    >
      <Loader2 className="animate-spin" size={18} />
      {label}
    </div>
  );
}
