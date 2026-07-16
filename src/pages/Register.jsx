import { useState } from "react";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Shield,
  Moon,
  Sun,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import LiveMap from "../components/LiveMap";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
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
    <div className="relative min-h-screen w-full overflow-hidden transition-colors duration-500">
      <LiveMap darkMode={darkMode} blur={focusedField !== null} />

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/30 dark:from-black/40 dark:via-transparent dark:to-black/50 pointer-events-none transition-opacity duration-500" />

      {/* Dark Mode Toggle */}
      <motion.button
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        onClick={() => {
          setDarkMode(!darkMode);
          document.documentElement.classList.toggle("dark", !darkMode);
        }}
        className="absolute top-6 right-6 z-50 w-12 h-12 rounded-full backdrop-blur-xl bg-white/10 dark:bg-black/20 border border-white/20 flex items-center justify-center text-gray-800 dark:text-white hover:scale-110 active:scale-95 transition-all duration-300 shadow-lg"
      >
        <AnimatePresence mode="wait">
          {darkMode ? (
            <motion.div
              key="moon"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <Moon className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <Sun className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Main Content */}
      <div className="relative z-30 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.3, stiffness: 200 }}
              className="inline-block mb-6 relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-violet-600 rounded-full blur-xl opacity-50 animate-pulse" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-2xl">
                <Shield className="w-10 h-10 text-white" />
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
            >
              Join Us
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Community Safety Network
            </motion.p>
          </div>

          {/* Register Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="backdrop-blur-xl bg-white/70 dark:bg-black/30 border border-white/30 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="relative p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Field */}
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User
                      className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${focusedField === "name" ? "text-blue-500" : "text-gray-400 dark:text-gray-600"}`}
                    />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      onFocus={() => setFocusedField("name")}
                      onBlur={() => setFocusedField(null)}
                      className="w-full pl-12 pr-4 py-3 bg-white/50 dark:bg-black/30 border-2 border-gray-200 dark:border-white/10 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${focusedField === "email" ? "text-blue-500" : "text-gray-400 dark:text-gray-600"}`}
                    />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      className="w-full pl-12 pr-4 py-3 bg-white/50 dark:bg-black/30 border-2 border-gray-200 dark:border-white/10 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${focusedField === "password" ? "text-blue-500" : "text-gray-400 dark:text-gray-600"}`}
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      className="w-full pl-12 pr-12 py-3 bg-white/50 dark:bg-black/30 border-2 border-gray-200 dark:border-white/10 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-400 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Password Strength */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all ${i <= passwordStrength ? strengthColors[passwordStrength] : "bg-gray-300 dark:bg-gray-700"}`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Strength: {strengthLabels[passwordStrength]}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock
                      className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${focusedField === "confirmPassword" ? "text-blue-500" : "text-gray-400 dark:text-gray-600"}`}
                    />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        handleChange("confirmPassword", e.target.value)
                      }
                      onFocus={() => setFocusedField("confirmPassword")}
                      onBlur={() => setFocusedField(null)}
                      className="w-full pl-12 pr-12 py-3 bg-white/50 dark:bg-black/30 border-2 border-gray-200 dark:border-white/10 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-400 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error message */}
                {error && (
                  <p className="text-sm text-red-500 dark:text-red-400">
                    {error}
                  </p>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="relative w-full group overflow-hidden mt-6"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity" />
                  <div
                    className={`relative py-4 px-6 rounded-2xl font-semibold text-white bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all ${loading ? "opacity-50" : "group-hover:scale-[1.02] active:scale-[0.98]"}`}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Creating account...</span>
                      </div>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Create Account
                        <ArrowRight className="w-5 h-5" />
                      </span>
                    )}
                  </div>
                </button>

                {/* Sign In Link */}
                <div className="text-center pt-4 border-t border-gray-200 dark:border-white/10 mt-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/")}
                      className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </form>
            </div>
          </motion.div>

          {/* Security Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-6 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 backdrop-blur-xl bg-white/10 dark:bg-black/20 border border-white/20 rounded-full text-xs text-gray-700 dark:text-gray-300">
              <Shield className="w-4 h-4 text-green-400" />
              <span>256-bit encryption • Your data is secure</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default Register;