/**
 * admin/layouts/AdminLayout.jsx
 *
 * Shell for the authenticated admin section: sidebar + header + content
 * area, rendered once by the parent "/admin" route in App.jsx and reused
 * for every nested admin page via <Outlet/>.
 *
 * NO wrapper "dark" div — like Dashboard.jsx / UserProfile.jsx, dark mode
 * is applied globally via ThemeContext putting "dark" on <html>.
 */
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";

const PAGE_TITLES = {
  "/admin/dashboard": "Overview",
  "/admin/incidents": "Incidents",
  "/admin/map": "Map",
  "/admin/users": "Users",
  "/admin/analytics": "Analytics",
  "/admin/settings": "Settings",
};

function titleForPath(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/admin/incidents/")) return "Incident Details";
  if (pathname.startsWith("/admin/users/")) return "User Details";
  return "Admin";
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-gray-50 dark:bg-na-navy">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 min-w-0 flex flex-col">
        <AdminHeader
          onMenuClick={() => setSidebarOpen((o) => !o)}
          title={titleForPath(pathname)}
        />
        <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
