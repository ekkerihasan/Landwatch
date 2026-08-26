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
        risk: {
          low: "#0f766e",       // teal-700
          lowBg: "#ccfbf1",     // teal-100
          medium: "#b45309",    // amber-700
          mediumBg: "#fef3c7",  // amber-100
          high: "#c2410c",      // orange-700
          highBg: "#ffedd5",    // orange-100
          critical: "#b91c1c",  // red-700
          criticalBg: "#fee2e2",// red-100
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
