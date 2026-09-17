/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        board: {
          bg: "#161310",       // near-black warm charcoal, the board's "table"
          cell: "#231d18",     // empty cell
          cellLine: "#3a3229", // grid lines
          panel: "#1c1815",    // card/panel surface
        },
        p1: {
          DEFAULT: "#c8843c",  // warm amber/wood — Player 1
          dim: "#8a5d2a",
        },
        p2: {
          DEFAULT: "#4c86a8",  // cool blue/stone — Player 2
          dim: "#335c73",
        },
        parchment: "#ece4d6",  // primary text on dark
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Inter", "Helvetica", "Arial", "sans-serif"],
        mono: ["SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
