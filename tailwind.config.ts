import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Satoshi", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      colors: {
        paper: "#FBFBFA",
        surface: {
          DEFAULT: "#FFFFFF",
          subtle: "#F6F6F4",
          muted: "#EFEFEA",
          hover: "#F3F3F0",
        },
        border: {
          subtle: "#EBEBE7",
          line: "#E0E0DB",
          dark: "#D0D0CA",
        },
        ink: {
          DEFAULT: "#191918",
          primary: "#171716",
          secondary: "#6B6B66",
          tertiary: "#969690",
          faint: "#BCBCB6",
        },
      },
      letterSpacing: {
        tightest: "-0.04em",
        tighter: "-0.025em",
        tight: "-0.015em",
        widest: "0.14em",
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(0, 0, 0, 0.03)",
        card: "0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)",
        lifted: "0 4px 12px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
