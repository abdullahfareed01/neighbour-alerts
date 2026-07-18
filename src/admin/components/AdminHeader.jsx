/**
 * admin/components/AdminHeader.jsx
 * Top bar for the admin layout. Mirrors the header pattern in
 * pages/Dashboard.jsx (hamburger on mobile, ThemeToggle, avatar) but
 * scoped to the admin section.
 */
import { Menu } from "lucide-react";
import ThemeToggle from "../../components/ui/ThemeToggle";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function AdminHeader({ onMenuClick, title = "Admin" }) {
  const { admin } = useAdminAuth();

  return (
    <header
      className="shrink-0 flex items-center gap-3 px-4 h-[60px]
        bg-white dark:bg-na-surface
        border-b border-gray-100 dark:border-na-border shadow-sm"
    >
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-xl
          text-gray-500 dark:text-slate-300
          hover:bg-gray-100 dark:hover:bg-na-hover
          active:scale-95 transition-colors"
        aria-label="Toggle admin sidebar"
      >
        <Menu size={20} />
      </button>

      <h1 className="text-base sm:text-lg font-bold text-gray-800 dark:text-slate-100 flex-1 truncate">
        {title}
      </h1>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <div
          className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600
            text-white font-bold text-sm flex items-center justify-center
            ring-2 ring-white dark:ring-na-border shrink-0"
          title={admin?.name ?? "Admin"}
        >
          {(admin?.name ?? "A").charAt(0)}
        </div>
      </div>
    </header>
  );
}
