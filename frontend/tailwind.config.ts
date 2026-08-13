import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        zoom: {
          blue: "#0E71EB",
          blueHover: "#005CE6",
          blueLight: "#F0F7FF",
          bg: "#F8FAFC",
          card: "#FFFFFF",
          sidebar: "#FFFFFF",
          border: "#E2E8F0",
          input: "#F1F5F9",
          text: "#0F172A",
          muted: "#64748B",
          red: "#E02828",
          green: "#10B981",
          orange: "#F97316"
        }
      }
    },
  },
  plugins: [],
};
export default config;
