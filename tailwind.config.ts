import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./layouts/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./styles/**/*.{js,ts,jsx,tsx,css}",
  ],
  theme: {
    extend: {
      colors: {
        "retro-bg": "var(--retro-bg)",
        "retro-surface": "var(--retro-surface)",
        "retro-surface-2": "var(--retro-surface-2)",
        "retro-border": "var(--retro-border)",
        "retro-accent": "var(--retro-accent)",
        "retro-accent-2": "var(--retro-accent-2)",
        "retro-accent-3": "var(--retro-accent-3)",
        "retro-text": "var(--retro-text)",
        "retro-text-muted": "var(--retro-text-muted)",
        "retro-success": "var(--retro-success)",
        "retro-error": "var(--retro-error)",
        "retro-warning": "var(--retro-warning)",
        "retro-info": "var(--retro-info)",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
        sans: ["Inter", "sans-serif"],
      },
      animation: {
        spin: "spin 1s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
