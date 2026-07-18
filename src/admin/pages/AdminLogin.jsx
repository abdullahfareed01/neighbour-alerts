/**
 * admin/pages/AdminLogin.jsx
 *
 * Admin sign-in screen. Deliberately styled as a calmer, more "internal
 * tool" surface than the public Login.jsx (which uses the animated
 * LiveMap + framer-motion marketing-style treatment) — admins land on a
 * focused, professional panel using the same na-* token palette as the
 * authenticated user app (Dashboard/Sidebar), so it reads as part of the
 * same product without competing with the public-facing login.
 *
 * Mock auth only — see admin/services/adminApi.js for the mock credentials.
 */
import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { ShieldCheck, AlertCircle, Loader2 } from "lucide-react";

import AuthInput from "../../components/auth/AuthInput";
import ThemeToggle from "../../components/ui/ThemeToggle";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { isAuthenticated, login, adminAuthAPI } = useAdminAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Already logged in as admin — skip straight past the login screen.
  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await adminAuthAPI.login(email, password);
      login(data.admin, data.token);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err?.message ?? "Invalid admin email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-na-navy px-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 items-center justify-center shadow-lg mb-4">
            <ShieldCheck size={26} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">
            Neighbour Alerts
          </h1>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-0.5">
            Admin Console
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-na-surface border border-gray-100 dark:border-na-border rounded-2xl shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <AuthInput
              id="admin-email"
              label="Admin Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              disabled={loading}
            />
            <AuthInput
              id="admin-password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
            />

            {error && (
              <p className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400">
                <AlertCircle size={13} className="shrink-0" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2
                bg-gradient-to-r from-blue-600 to-blue-700
                hover:from-blue-700 hover:to-blue-800
                disabled:opacity-60 disabled:cursor-not-allowed
                active:scale-[.98] text-white py-2.5 rounded-xl font-semibold text-sm
                transition-all shadow-sm hover:shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in to Admin Console"
              )}
            </button>
          </form>
        </div>

        {/* Mock credentials hint — dev only */}
        <div className="mt-4 text-center text-[11px] text-gray-400 dark:text-slate-500 leading-relaxed">
          Dev mock login — email{" "}
          <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-na-hover text-gray-500 dark:text-slate-400">
            admin@neighbouralerts.com
          </code>{" "}
          / password{" "}
          <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-na-hover text-gray-500 dark:text-slate-400">
            admin123
          </code>
        </div>
      </div>
    </div>
  );
}
