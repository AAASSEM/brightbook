/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Lumina Learning Color System ──────────────────
        background: "#f5fced",
        surface: {
          DEFAULT: "#f5fced",
          dim: "#d5dcce",
          bright: "#f5fced",
          "container-lowest": "#ffffff",
          "container-low": "#eff6e7",
          container: "#e9f0e1",
          "container-high": "#e3ebdc",
          "container-highest": "#dee5d6",
          variant: "#dee5d6",
          tint: "#006e1c",
        },
        "on-surface": "#171d14",
        "on-surface-variant": "#3f4a3c",
        "inverse-surface": "#2c3228",
        "inverse-on-surface": "#ecf3e4",
        outline: {
          DEFAULT: "#6f7a6b",
          variant: "#becab9",
        },
        // Primary — Warm Green
        primary: {
          DEFAULT: "#006e1c",
          container: "#4caf50",
          fixed: "#94f990",
          "fixed-dim": "#78dc77",
        },
        "on-primary": "#ffffff",
        "on-primary-container": "#003c0b",
        "inverse-primary": "#78dc77",
        // Secondary — Amber/Gold
        secondary: {
          DEFAULT: "#785900",
          container: "#fdc003",
          fixed: "#ffdf9e",
          "fixed-dim": "#fabd00",
        },
        "on-secondary": "#ffffff",
        "on-secondary-container": "#6c5000",
        // Tertiary — Sky Blue
        tertiary: {
          DEFAULT: "#0061a4",
          container: "#33a0fe",
          fixed: "#d1e4ff",
          "fixed-dim": "#9ecaff",
        },
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#00355d",
        // Error
        error: {
          DEFAULT: "#ba1a1a",
          container: "#ffdad6",
        },
        "on-error": "#ffffff",
        "on-error-container": "#93000a",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        kid: ["Lexend", "sans-serif"],
        parent: ["Plus Jakarta Sans", "sans-serif"],
        admin: ["Inter", "sans-serif"],
        arabic: ["Noto Sans Arabic", "sans-serif"],
      },
      fontSize: {
        "kid-headline-lg": ["32px", { lineHeight: "1.2", fontWeight: "700" }],
        "kid-body-md": ["18px", { lineHeight: "1.5", fontWeight: "400" }],
        "parent-headline-md": ["24px", { lineHeight: "1.3", fontWeight: "600" }],
        "parent-body-sm": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        "admin-label-xs": ["12px", { lineHeight: "1", fontWeight: "500" }],
      },
      spacing: {
        "kid-margin": "24px",
        "parent-margin": "16px",
        gutter: "16px",
        "stack-sm": "12px",
        "stack-md": "24px",
        "stack-lg": "40px",
        "touch-min": "48px",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        card: "0 12px 32px rgba(0, 110, 28, 0.08)",
        "card-hover": "0 16px 48px rgba(0, 110, 28, 0.16)",
        "kid-btn": "0 4px 0 0 #388e3c",
        "danger-btn": "0 4px 0 0 #8b0000",
        float: "0 8px 32px rgba(76, 175, 80, 0.2), 0 2px 8px rgba(0,0,0,0.06)",
        nav: "0 -8px 24px rgba(76, 175, 80, 0.12)",
      },
      keyframes: {
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        floatUp: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        popIn: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        float: "floatUp 3s ease-in-out infinite",
        "pop-in": "popIn 0.3s ease-out forwards",
      },
    },
  },
  plugins: [],
};
