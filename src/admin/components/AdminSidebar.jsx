/**
 * admin/components/AdminSidebar.jsx
 * Admin navigation sidebar. Responsive pattern (fixed overlay on mobile,
 * static column on desktop) mirrors components/layout/Sidebar.jsx so the
 * admin section feels consistent with the rest of the app.
 */
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  AlertTriangle,
  Map,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ShieldCheck,
  X,
} from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";

const NAV_ITEMS = [
  { to: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/incidents", label: "Incidents", icon: AlertTriangle },
  { to: "/admin/map", label: "Map", icon: Map },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminSidebar({ open = true, onClose }) {
  const navigate = useNavigate();
  const { admin, logout } = useAdminAuth();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <>
      <aside
        className={[
          "flex flex-col bg-white dark:bg-na-surface",
          "border-r border-gray-100 dark:border-na-border",

          // Desktop
          "md:relative md:w-64 md:h-full md:translate-x-0",

          // Mobile overlay
          "fixed inset-y-0 left-0 z-[9999] w-72",

          "transition-transform duration-300 ease-in-out",
          open
            ? "translate-x-0 shadow-2xl"
            : "-translate-x-full md:translate-x-0",
        ].join(" ")}
      >
        {/* Brand */}
        <div className="shrink-0 flex items-center justify-between gap-2 px-4 h-[60px] border-b border-gray-100 dark:border-na-border">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-800 dark:text-slate-100 leading-none truncate">
                Admin Console
              </p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5 truncate">
                Neighbour Alerts
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-lg text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-na-hover transition-colors shrink-0"
              aria-label="Close sidebar"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const ItemIcon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/25 text-blue-600 dark:text-blue-400"
                      : "text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-na-hover hover:text-gray-700 dark:hover:text-slate-200",
                  ].join(" ")
                }
              >
                <ItemIcon size={17} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Admin identity + logout */}
        <div className="shrink-0 p-3 border-t border-gray-100 dark:border-na-border">
          <div className="flex items-center gap-2.5 px-1 mb-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {(admin?.name ?? "A").charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 dark:text-slate-100 truncate">
                {admin?.name ?? "Admin"}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate">
                {admin?.email ?? ""}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2
              bg-gray-50 dark:bg-na-hover hover:bg-gray-100 dark:hover:bg-na-border
              text-gray-600 dark:text-slate-300
              active:scale-[.98] py-2 rounded-xl font-semibold text-xs
              transition-all"
          >
            <LogOut size={13} />
            Logout
          </button>
        </div>
      </aside>

      {open && (
        <div
          className="md:hidden fixed inset-0 z-[9998] bg-black/40 backdrop-blur-[2px]"
          onClick={onClose}
        />
      )}
    </>
  );
}
