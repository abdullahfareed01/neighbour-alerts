/**
 * admin/routes/AdminProtectedRoute.jsx
 * Mirrors routes/ProtectedRoute.jsx but gates on AdminAuthContext instead
 * of the regular user AuthContext. Redirects unauthenticated visitors to
 * /admin/login instead of "/".
 *
 * NOTE: this is frontend-only route gating for the mock phase. It is not
 * a security boundary — once a real backend exists, admin endpoints must
 * independently verify a valid admin token/role server-side.
 */
import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function AdminProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-na-navy text-gray-500 dark:text-slate-400 text-sm">
        Loading admin session…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
