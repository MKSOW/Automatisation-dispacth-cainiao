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
        // Vert principal (chauffeur / CTA)
        brand: {
          50: "#ecfff4",
          100: "#d6ffe7",
          200: "#a9f6c6",
          300: "#7eeea7",
          400: "#52e687",
          500: "#12d85a",
          600: "#0ea84d",
          700: "#0c9c38",
          800: "#0a7a2f",
          900: "#075324"
        },
        // Bleu accent (admin / liens)
        accent: {
          50: "#e8f1ff",
          100: "#d5e7ff",
          200: "#a9cbff",
          300: "#7daeff",
          400: "#4e92f5",
          500: "#2c7be5",
          600: "#1f5fba",
          700: "#164694",
          800: "#0f2f6e",
          900: "#091f4d"
        },
        danger: {
          50: "#ffecec",
          100: "#ffd7d7",
          200: "#ffb3b3",
          300: "#ff8f8f",
          400: "#ff6b6b",
          500: "#e04b4b",
          600: "#c03e3e",
          700: "#a03131",
          800: "#802424",
          900: "#601717"
        },
        neutral: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a"
        }
      },
      boxShadow: {
        card: "0 10px 40px rgba(15, 23, 42, 0.08)",
        soft: "0 6px 24px rgba(15, 23, 42, 0.06)",
      },
      borderRadius: {
        xl: "16px",
        '2xl': "20px",
      }
    }
  },
  plugins: [],
};

export default config;
