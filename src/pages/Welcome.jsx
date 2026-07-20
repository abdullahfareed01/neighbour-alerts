/**
 * pages/Welcome.jsx
 *
 * Public landing screen — the first thing a new visitor sees, now living
 * at the app's root route ("/"). Login.jsx moved to "/login" so this
 * screen could take the root over.
 *
 * Intentionally simple, per design brief: brand identity + tagline +
 * short description + two clear entry points (Log In / Create Account).
 * No map, no incident feed, no dashboard preview, no location prompt —
 * this is an introduction to the product, not another dashboard.
 *
 * Visual language:
 *  - Reuses the same rounded shield "badge" identity as SplashScreen.jsx
 *    (gradient tile + Shield icon) so returning visitors recognize it.
 *  - Reuses the calm "bg-gray-50 / dark:bg-na-navy + ThemeToggle in the
 *    corner" pattern AdminLogin.jsx already established, rather than the
 *    heavier LiveMap canvas background Login/Register use — this keeps
 *    the very first screen light and fast instead of decorative.
 *  - Only lucide-react icons already proven elsewhere in this codebase
 *    are used (Shield, ArrowRight, User), consistent with this project's
 *    existing "don't guess at unverified icon names" convention.
 */
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, ArrowRight, User } from "lucide-react";
import ThemeToggle from "../components/ui/ThemeToggle";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex flex-col bg-gray-50 dark:bg-na-navy px-4 overflow-hidden">
      {/* Soft ambient glow — plain CSS, no canvas/map, keeps this screen light */}
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

      {/* Main content */}
      <div className="relative flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-full max-w-sm mx-auto flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.05 }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-xl shadow-blue-500/20 mb-6"
          >
            <Shield size={38} className="text-white" strokeWidth={2.2} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-slate-100"
          >
            Neighbour Alerts
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="mt-2 text-sm font-semibold text-blue-600 dark:text-blue-400"
          >
            Stay aware. Stay connected. Stay safe.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="mt-4 text-sm text-gray-500 dark:text-slate-400 leading-relaxed"
          >
            See nearby safety alerts, report incidents, and help keep your
            community informed.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.36 }}
            className="mt-9 w-full flex flex-col gap-3"
          >
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full flex items-center justify-center gap-2
                bg-gradient-to-r from-blue-600 to-blue-700
                hover:from-blue-700 hover:to-blue-800
                active:scale-[.98] text-white py-3.5 rounded-2xl font-semibold text-sm
                shadow-md hover:shadow-lg transition-all"
            >
              Log In
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={() => navigate("/register")}
              className="w-full flex items-center justify-center gap-2
                bg-white dark:bg-na-surface
                border border-gray-200 dark:border-na-border
                text-gray-700 dark:text-slate-200
                hover:bg-gray-50 dark:hover:bg-na-hover
                active:scale-[.98] py-3.5 rounded-2xl font-semibold text-sm
                transition-all"
            >
              <User size={16} />
              Create an Account
            </button>
          </motion.div>
        </div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative pb-6 text-center text-[11px] text-gray-400 dark:text-slate-500"
      >
        A community safety network built by neighbours, for neighbours.
      </motion.p>
    </div>
  );
}
