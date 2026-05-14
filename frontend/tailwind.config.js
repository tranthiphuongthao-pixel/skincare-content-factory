/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#faf8f5",
        "bg-primary": "#faf8f5",
        surface: "#ffffff",
        card: "#ffffff",
        "bg-surface": "#ffffff",
        "bg-surface-2": "#f5f0eb",
        accent: "#d4a0c0",
        "accent-dark": "#a06080",
        gold: "#c9a96e",
        highlight: "#c9a96e",
        "text-primary": "#2d2020",
        "text-secondary": "#8a7070",
        "text-muted": "#8a7070",
        border: "#e8ddd5",
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["Playfair Display", "serif"],
      },
    },
  },
  plugins: [],
};
