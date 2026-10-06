import type { Config } from "tailwindcss";
import { heroui } from "@heroui/theme";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"],
        mono: ["var(--font-mono)"],
      },
      fontSize: {
        "step--1": "0.75rem",
        "step-0": "1rem",
        "step-1": "clamp(1.125rem, 1.05rem + 0.35vw, 1.333rem)",
        "step-2": "clamp(1.375rem, 1.2rem + 0.8vw, 1.777rem)",
        "step-3": "clamp(1.625rem, 1.3rem + 1.5vw, 2.369rem)",
        "step-4": "clamp(2rem, 1.5rem + 2.4vw, 3.157rem)",
        "step-5": "clamp(2.5rem, 1.7rem + 3.8vw, 4.209rem)",
        "step-6": "clamp(3rem, 1.8rem + 5.6vw, 5.61rem)",
        "display-xl": "clamp(4rem, 1rem + 12vw, 12rem)",
        "ui-md": "0.9375rem",
        "ui-sm": "0.875rem",
        "ui-xs": "0.8125rem",
      },
      maxWidth: {
        container: "1320px",
        shop: "1320px",
        narrow: "1120px",
        wide: "1440px",
        read: "720px",
      },
      spacing: {
        gutter: "var(--gutter)",
      },
      colors: {
        surface: {
          DEFAULT: "var(--color-bg)",
          1: "var(--color-bg-secondary)",
          2: "var(--color-bg-tertiary)",
          warm: "var(--color-bg-warm)",
        },
        raised: "var(--color-raised)",
        stage: "var(--color-stage)",
        "on-stage": "var(--color-on-stage)",
        ink: {
          DEFAULT: "var(--color-text)",
          muted: "var(--color-text-secondary)",
          subtle: "var(--color-text-tertiary)",
        },
        brand: {
          DEFAULT: "var(--color-accent)",
          hover: "var(--color-accent-hover)",
          soft: "var(--color-accent-light)",
          2: "var(--color-accent-2)",
        },
        "on-brand": "var(--color-on-accent)",
        sale: "var(--color-accent-3)",
        line: {
          DEFAULT: "var(--color-border)",
          hover: "var(--color-border-hover)",
        },
        control: "var(--color-border-control)",
        focus: "var(--color-focus)",
        scrim: "var(--color-scrim)",
        promo: {
          blue: "var(--promo-bg-blue)",
          warm: "var(--promo-bg-warm)",
          green: "var(--promo-bg-green)",
        },
        success: { DEFAULT: "var(--color-success)", tint: "var(--color-success-tint)" },
        warning: { DEFAULT: "var(--color-warning)", tint: "var(--color-warning-tint)" },
        danger: { DEFAULT: "var(--color-danger)", tint: "var(--color-danger-tint)" },
        info: { DEFAULT: "var(--color-info)", tint: "var(--color-info-tint)" },
        "on-danger": "var(--color-on-danger)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
        accent: "var(--shadow-accent)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        panel: "var(--shadow-panel)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        pill: "var(--radius-pill)",
      },
      transitionTimingFunction: {
        instrument: "var(--ease-instrument)",
        std: "cubic-bezier(0.4, 0, 0.2, 1)",
        "in-out-strong": "cubic-bezier(0.76, 0, 0.24, 1)",
      },
      transitionDuration: {
        micro: "160ms",
        ui: "260ms",
        panel: "320ms",
        reveal: "900ms",
      },
      zIndex: {
        "tray-item": "1",
        sticky: "40",
        dropdown: "50",
        drawer: "60",
        modal: "70",
        toast: "80",
        cookie: "90",
      },
      backgroundImage: {
        "gradient-brand": "var(--gradient-accent)",
        "gradient-warm": "var(--gradient-warm)",
        "gradient-cool": "var(--gradient-cool)",
        "gradient-hero": "var(--gradient-hero)",
        "gradient-badge": "var(--gradient-badge)",
      },
    },
  },
  plugins: [
    heroui({
      layout: { radius: { small: "0px", medium: "0px", large: "0px" } },
      themes: {
        light: { colors: { background: "#F6F6F5", foreground: "#141517", primary: { DEFAULT: "#141517", foreground: "#F6F6F5" } } },
        dark: { colors: { background: "#0D0E10", foreground: "#ECEAE5", primary: { DEFAULT: "#ECEAE5", foreground: "#0D0E10" } } },
      },
    }),
  ],
};

export default config;
