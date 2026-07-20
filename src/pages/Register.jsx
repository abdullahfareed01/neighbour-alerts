/**
 * pages/Register.jsx
 *
 * Redesigned to match the lighter visual language introduced by
 * Welcome.jsx / AdminLogin.jsx / the redesigned Login.jsx: soft ambient
 * blobs on a calm bg-gray-50/na-navy surface instead of the old LiveMap
 * canvas background + glassmorphism card, and the shared AuthInput
 * component instead of duplicating hand-rolled icon-inputs (this also
 * removes the manual showPassword/showConfirmPassword state — AuthInput
 * already has its own show/hide toggle built in). Drops the page-local
 * `darkMode` state in favor of the same <ThemeToggle/> every other page
 * uses.
 *
 * Validation and submit logic are untouched: still goes through
 * useAuth()/authAPI exactly as before, including the password-strength
 * meter.
 */
import { useState } from "react";
import {
  Shield,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
import AuthInput from "../components/auth/AuthInput";
import ThemeToggle from "../components/ui/ThemeToggle";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim() || !formData.email.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await authAPI.register(
        formData.name,
        formData.email,
        formData.password,
      );
      login(data.user, data.token);
      navigate("/dashboard");
    } catch (err) {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Password strength
  const getPasswordStrength = () => {
    if (!formData.password) return 0;
    let strength = 0;
    if (formData.password.length >= 8) strength++;
    if (/[A-Z]/.test(formData.password)) strength++;
    if (/[a-z]/.test(formData.password)) strength++;
    if (/\d/.test(formData.password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength();
  const strengthColors = [
    "bg-gray-300",
    "bg-red-500",
    "bg-yellow-500",
    "bg-blue-500",
    "bg-green-500",
  ];
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

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
              Create your account
            </h1>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-0.5">
              Join your neighbours keeping the community safe.
            </p>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-na-surface border border-gray-100 dark:border-na-border rounded-2xl shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <AuthInput
                id="register-name"
                label="Full Name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                autoComplete="name"
                disabled={loading}
              />
              <AuthInput
                id="register-email"
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                autoComplete="email"
                disabled={loading}
              />

              <div>
                <AuthInput
                  id="register-password"
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  autoComplete="new-password"
                  disabled={loading}
                />
                {formData.password && (
                  <div className="mt-2 px-0.5">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all ${
                            i <= passwordStrength
                              ? strengthColors[passwordStrength]
                              : "bg-gray-200 dark:bg-na-border"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500">
                      Strength: {strengthLabels[passwordStrength]}
                    </p>
                  </div>
                )}
              </div>

              <AuthInput
                id="register-confirm-password"
                label="Confirm Password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleChange("confirmPassword", e.target.value)
                }
                autoComplete="new-password"
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
                  active:scale-[.98] text-white py-3 rounded-xl font-semibold text-sm
                  transition-all shadow-sm hover:shadow-md"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Creating account…
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-4 mt-4 border-t border-gray-100 dark:border-na-border">
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  Sign in
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

export default Register;
