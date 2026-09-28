import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#EEDCEE",
        bg: "#F6F3F0",
        surface: "#FFFCF9",
        ink: "#2C2826",
        muted: "#5E5856",
        line: "#E4DDE0",
        blush: "#F3E4E1",
        sage: "#D7E3D4",
        dust: "#D5E0E8",
        cream: "#F4EFE6",
        mist: "#E6E2DE",
        sand: "#E8E0D4",
      },
      fontFamily: {
        sans: ["var(--font-tajawal)", "Tajawal", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 28px rgba(44, 40, 38, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
