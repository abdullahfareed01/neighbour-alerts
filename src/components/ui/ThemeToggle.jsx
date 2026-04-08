/**
 * components/ui/ThemeToggle.jsx
 * Light mode: subtle gray pill. Dark mode: bare icon, no background, no hover bg.
 */
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export default function ThemeToggle({ className = "" }) {
  const { dark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={`
        w-9 h-9 rounded-xl flex items-center justify-center
        transition-colors duration-200
        ${
          dark
            ? "text-slate-300 hover:text-yellow-400 bg-transparent border-0 outline-none ring-0 focus:ring-0 focus:outline-none"
            : "bg-gray-0 text-gray-500 hover:bg-gray-0 hover:text-gray-700"
        }
        ${className}
      `}
    >
      {dark ? <Sun size={18} /> : <Moon size={17} />}
    </button>
  );
}
