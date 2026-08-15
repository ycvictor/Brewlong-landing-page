import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cream: { 50: "#FDFBF6", 100: "#FAF6EE" },
        /* Sampled straight from the hand-drawn teapot logo. */
        cobalt: { 600: "#16368E", 700: "#0B2C89" },
        /* Warm tea tones for body text, borders and the steam wisps. */
        steep: { 300: "#E6B571", 600: "#A46530", 800: "#5F3921" },
      },
      fontFamily: {
        /* Matches brewlong.carrd.co — Yomogi for headings, Spectral for body. */
        hand: ["var(--font-hand)", "cursive"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      keyframes: {
        "rise-in": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        steam: {
          "0%": { opacity: "0", transform: "translateY(4px) scaleX(0.9)" },
          "35%": { opacity: "0.55" },
          "100%": { opacity: "0", transform: "translateY(-16px) scaleX(1.25)" },
        },
      },
      animation: {
        "rise-in": "rise-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        steam: "steam 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
