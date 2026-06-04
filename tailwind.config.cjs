/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172126",
        panel: "#ffffff",
        line: "#d8e2e6",
        muted: "#60727b",
        brand: "#0f8b8d",
        brandDark: "#0b6769"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(23, 33, 38, 0.08)"
      }
    }
  },
  plugins: []
};
