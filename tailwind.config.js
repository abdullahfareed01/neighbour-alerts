import forms from "@tailwindcss/forms";

/** @type {import('tailwindcss').Config} */
export default {
  // Enable dark mode using class
  darkMode: "class",

  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],

  theme: {
    extend: {
      // ✅ COLORS (both configs merged)
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        // 🔵 Your custom navy system
        na: {
          navy: "#0f172a",
          surface: "#1a2744",
          card: "#1e2d4a",
          hover: "#243557",
          input: "#1a2744",
          border: "#2d3f5e",
        },
      },

      // ✅ FONTS
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },

      // ✅ ANIMATIONS
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 3s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },

      // ✅ BLUR
      backdropBlur: {
        xs: "2px",
      },
      blur: {
        "4xl": "100px",
      },

      // ✅ SHADOWS
      boxShadow: {
        "glow-sm": "0 0 10px rgba(59, 130, 246, 0.4)",
        glow: "0 0 20px rgba(59, 130, 246, 0.5)",
        "glow-lg": "0 0 40px rgba(59, 130, 246, 0.6)",
        "glow-purple": "0 0 30px rgba(139, 92, 246, 0.5)",
        "glow-pink": "0 0 30px rgba(236, 72, 153, 0.5)",

        "na-glow-blue": "0 0 20px rgba(59, 130, 246, 0.35)",
        "na-glow-purple": "0 0 20px rgba(139, 92, 246, 0.35)",
      },

      // ✅ RING
      ringWidth: {
        3: "3px",
      },
    },
  },

  plugins: [
    forms({ strategy: "class" }),
  ],
};