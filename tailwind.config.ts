import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/types/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/services/**/*.{js,ts,jsx,tsx,mdx}",
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
