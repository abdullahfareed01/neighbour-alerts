/**
 * components/ui/ReportSuccessAnimation.jsx
 * Full-screen burst animation shown after a new incident is reported.
 * Auto-dismisses after 1.8 seconds.
 */
import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";

export default function ReportSuccessAnimation({ type, onDone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 1800);
    return () => clearTimeout(t);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center pointer-events-none"
      style={{ animation: "successFade 1.8s ease forwards" }}
    >
      {/* Ripple rings */}
      <div
        className="absolute w-64 h-64 rounded-full bg-green-400/20"
        style={{ animation: "ripple 1.2s ease-out 0.1s both" }}
      />
      <div
        className="absolute w-48 h-48 rounded-full bg-green-400/30"
        style={{ animation: "ripple 1.2s ease-out 0.25s both" }}
      />
      <div
        className="absolute w-32 h-32 rounded-full bg-green-400/40"
        style={{ animation: "ripple 1.2s ease-out 0.4s both" }}
      />

      {/* Center badge */}
      <div
        className="relative z-10 flex flex-col items-center gap-3 bg-white dark:bg-gray-800 rounded-3xl px-10 py-8 shadow-2xl"
        style={{
          animation: "successPop 0.4s cubic-bezier(.22,.68,0,1.3) both",
        }}
      >
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
          <CheckCircle size={36} className="text-green-500" />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-800 dark:text-white">
            Incident Reported!
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {type} added to the map
          </p>
        </div>
      </div>

      <style>{`
        @keyframes successFade { 0%,70%{opacity:1} 100%{opacity:0} }
        @keyframes ripple { from{transform:scale(0);opacity:1} to{transform:scale(1);opacity:0} }
        @keyframes successPop {
          from{opacity:0;transform:scale(0.7)}
          to{opacity:1;transform:scale(1)}
        }
      `}</style>
    </div>
  );
}
