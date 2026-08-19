import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "inverse-primary": "#bf0715",
        "tertiary-container": "#5d60eb",
        "surface-container-low": "#1c1b1d",
        "error-container": "#93000a",
        "surface-bright": "#39393b",
        "surface": "#131315",
        "on-tertiary-fixed-variant": "#2f2ebe",
        "surface-container-lowest": "#0e0e10",
        "outline-variant": "#5c403c",
        "secondary": "#4edea3",
        "surface-container-high": "#2a2a2c",
        "on-primary-fixed-variant": "#93000b",
        "secondary-fixed": "#6ffbbe",
        "primary-fixed": "#ffdad6",
        "primary-container": "#dc2626",
        "primary": "#ffb4ab",
        "on-error": "#690005",
        "surface-variant": "#353437",
        "outline": "#ac8884",
        "on-secondary-fixed-variant": "#005236",
        "secondary-fixed-dim": "#4edea3",
        "on-secondary-container": "#00311f",
        "on-secondary": "#003824",
        "secondary-container": "#00a572",
        "primary-fixed-dim": "#ffb4ab",
        "on-background": "#e5e1e4",
        "error": "#ffb4ab",
        "on-primary": "#690005",
        "surface-dim": "#131315",
        "surface-container-highest": "#353437",
        "tertiary-fixed": "#e1e0ff",
        "on-tertiary-fixed": "#07006c",
        "on-error-container": "#ffdad6",
        "background": "#131315",
        "on-primary-fixed": "#410002",
        "tertiary-fixed-dim": "#c0c1ff",
        "on-tertiary": "#1000a9",
        "inverse-on-surface": "#313032",
        "on-surface": "#e5e1e4",
        "tertiary": "#c0c1ff",
        "inverse-surface": "#e5e1e4",
        "on-primary-container": "#fff6f5",
        "on-surface-variant": "#e6bdb8",
        "on-secondary-fixed": "#002113",
        "on-tertiary-container": "#faf6ff",
        "surface-tint": "#ffb4ab",
        "surface-container": "#201f22"
      },
      fontFamily: {
        sans: ["Geist", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        "label-caps": ["JetBrains Mono", "monospace"],
        "data-mono": ["JetBrains Mono", "monospace"],
        "display-emergency": ["Geist", "sans-serif"],
        "body-md": ["Geist", "sans-serif"],
        "headline-lg": ["Geist", "sans-serif"],
        "body-lg": ["Geist", "sans-serif"],
        "headline-md": ["Geist", "sans-serif"]
      },
      maxWidth: {
        "container-max": "1200px"
      },
      padding: {
        "margin-mobile": "20px",
        "margin-desktop": "48px"
      },
      spacing: {
        "margin-mobile": "20px",
        "margin-desktop": "48px"
      },
      boxShadow: {
        "glow-safe": "0 0 40px rgba(78, 222, 163, 0.3)",
        "glow-alert": "0 0 60px rgba(220, 38, 38, 0.6)",
        "hud-glow": "0 0 20px rgba(78, 222, 163, 0.15)",
        "danger-glow": "0 0 25px rgba(220, 38, 38, 0.5)"
      }
    },
  },
  plugins: [],
};
export default config;
