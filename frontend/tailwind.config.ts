import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#e6f0ff",
          100: "#c2d7ff",
          200: "#9cbcff",
          300: "#76a1ff",
          400: "#5086ff",
          500: "#2a6cff",
          600: "#1d53cc",
          700: "#143c99",
          800: "#0b2666",
          900: "#051333"
        }
      }
    }
  },
  plugins: [],
};

export default config;
