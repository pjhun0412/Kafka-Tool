/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#d4d4d4",
        panel: "#252526",
        line: "#3c3c3c",
        muted: "#8b949e",
        brand: "#3794ff",
        brandDark: "#0e639c"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(0, 0, 0, 0.32)"
      }
    }
  },
  plugins: []
};
