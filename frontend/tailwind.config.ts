import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Institutional greens — the brand colour of the system.
        forest: {
          900: "#072a24",
          800: "#0b3b32",
          700: "#10564a",
          600: "#157a68",
          500: "#4a7c6f",
          50: "#e4ede9",
        },
        // Warm grounds. There is no plain white surface in this design.
        cream: {
          DEFAULT: "#f7f4ed",
          deep: "#efeadf",
          surface: "#fffdf8",
          alt: "#faf7f0",
        },
        ink: {
          DEFAULT: "#16232b",
          2: "#47585f",
          3: "#7a8a8f",
        },
        line: {
          DEFAULT: "#ded7c9",
          soft: "#eae4d8",
        },
        // Risk is the only saturated family, so severity is what draws the eye.
        risk: {
          low: "#1f7a5c",
          lowBg: "#e3f1ea",
          medium: "#97690d",
          mediumBg: "#f8efd9",
          high: "#b3561d",
          highBg: "#fae9dc",
          critical: "#9e2a20",
          criticalBg: "#f8e3e0",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(22, 35, 43, 0.04), 0 6px 16px -10px rgba(22, 35, 43, 0.16)",
        raised: "0 2px 4px rgba(22, 35, 43, 0.05), 0 12px 28px -14px rgba(22, 35, 43, 0.22)",
      },
      borderRadius: {
        // Moderate corners — institutional, not consumer-app.
        card: "0.5rem",
      },
    },
  },
  plugins: [],
};
export default config;
