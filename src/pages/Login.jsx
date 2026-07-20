/**
 * pages/Login.jsx
 *
 * Redesigned to match the lighter visual language introduced by
 * Welcome.jsx / AdminLogin.jsx: soft ambient blobs on a calm
 * bg-gray-50/na-navy surface instead of the old LiveMap canvas
 * background + glassmorphism card, and the shared AuthInput component
 * (already used by admin/pages/AdminLogin.jsx) instead of duplicating
 * hand-rolled icon-inputs. Also drops the page-local `darkMode` state
 * that used to fight with the global ThemeContext (this page now uses
 * the same <ThemeToggle/> every other page uses).
 *
 * Auth logic is untouched: still goes through useAuth()/authAPI exactly
 * as before.
 */
import { useState } from "react";
import { Shield, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
import AuthInput from "../components/auth/AuthInput";
import ThemeToggle from "../components/ui/ThemeToggle";

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await authAPI.login(formData.email, formData.password);
      login(data.user, data.token);
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-gray-50 dark:bg-na-navy px-4 overflow-hidden">
      {/* Soft ambient glow — same treatment as Welcome.jsx, no canvas/map */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-24 w-80 h-80 rounded-full bg-blue-200/40 dark:bg-blue-900/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-24 w-80 h-80 rounded-full bg-violet-200/40 dark:bg-violet-900/20 blur-3xl"
      />

      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="relative flex-1 flex items-center justify-center py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          {/* Back to Welcome */}
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mb-5 flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft size={14} />
            Back
          </button>

          {/* Brand */}
          <div className="text-center mb-6">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 items-center justify-center shadow-lg mb-4">
              <Shield size={26} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">
              Welcome back
            </h1>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-0.5">
              Log in to keep your neighbourhood informed.
            </p>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-na-surface border border-gray-100 dark:border-na-border rounded-2xl shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <AuthInput
                id="login-email"
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                autoComplete="username"
                disabled={loading}
              />
              <AuthInput
                id="login-password"
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />

              <div className="flex justify-end -mt-1">
                <button
                  type="button"
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

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
                  active:scale-[.98] text-white py-3 rounded-xl font-semibold text-sm
                  transition-all shadow-sm hover:shadow-md"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Log In"
                )}
              </button>
            </form>

            <div className="text-center pt-4 mt-4 border-t border-gray-100 dark:border-na-border">
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  Sign up
                </button>
              </p>
            </div>
          </div>

          <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] text-gray-400 dark:text-slate-500">
            <Shield size={12} />
            256-bit encryption • Your data is secure
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default Login;
