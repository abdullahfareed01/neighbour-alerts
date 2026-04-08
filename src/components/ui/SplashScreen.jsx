/**
 * components/ui/SplashScreen.jsx
 * Shown once on first load / after login.
 * Props:
 *   onDone [fn] — called when animation completes
 */
import { useEffect, useState } from "react";
import { Shield } from "lucide-react";

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState("in"); // in | shown | out

  useEffect(() => {
    // Show for 2.2 seconds, then fade out
    const t1 = setTimeout(() => setPhase("out"), 4200);
    const t2 = setTimeout(() => onDone?.(), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-gradient-to-br from-blue-700 via-blue-600 to-purple-700"
      style={{
        transition: "opacity 0.6s ease",
        opacity: phase === "out" ? 0 : 1,
        pointerEvents: phase === "out" ? "none" : "all",
      }}
    >
      {/* Logo badge */}
      <div
        className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 shadow-2xl"
        style={{ animation: "splashPop 0.5s cubic-bezier(.22,.68,0,1.3) 0.15s both" }}
      >
        <Shield size={48} className="text-white drop-shadow-lg" />
      </div>

      {/* Title */}
      <h1
        className="text-4xl font-bold text-white tracking-tight mb-2"
        style={{ animation: "splashFadeUp 0.5s ease 0.35s both" }}
      >
        Neighbour's Alert
      </h1>

      {/* Tagline */}
      <p
        className="text-blue-100 text-base mb-10"
        style={{ animation: "splashFadeUp 0.5s ease 0.5s both" }}
      >
        Keep your surroundings safe
      </p>

      {/* Spinner */}
      <div
        className="flex items-center gap-2"
        style={{ animation: "splashFadeUp 0.5s ease 0.65s both" }}
      >
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        <span className="text-blue-100 text-sm">Loading…</span>
      </div>

      <style>{`
        @keyframes splashPop {
          from { opacity: 0; transform: scale(0.6); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes splashFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}