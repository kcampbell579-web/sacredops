import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef5ff",
          100: "#d9e8ff",
          200: "#bcd7ff",
          300: "#8ebeff",
          400: "#5999ff",
          500: "#3172f6",
          600: "#1d54e3",
          700: "#1841c0",
          800: "#1a389c",
          900: "#1b347b",
          950: "#14204b",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
