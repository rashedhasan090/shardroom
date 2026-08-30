import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#100c0a",
          900: "#1a1410",
          800: "#261c16",
          700: "#3a2e26",
          600: "#4d3f34",
        },
        clay: {
          200: "#f4eadc",
          300: "#e7d3b8",
          400: "#d4b48a",
          500: "#c48a4a",
        },
        ember: {
          300: "#f0b27a",
          400: "#e08a3c",
          500: "#c45c26",
          600: "#9a3f16",
        },
        moss: {
          400: "#7d8f74",
          600: "#4a5c45",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        kiln: "0 0 0 1px rgba(224, 138, 60, 0.25), 0 24px 80px rgba(0, 0, 0, 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
