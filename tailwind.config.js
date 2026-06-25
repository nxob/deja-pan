/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./hooks/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#050505",
        coal: "#0c0c0c",
        charcoal: "#151515",
        smoke: "#24201f",
        cream: "#f4efe7",
        muted: "#9b9187",
        crimson: "#9f2338",
        blood: "#5f1424",
        champagne: "#d7b878",
      },
      boxShadow: {
        editorial: "0 30px 90px rgba(0,0,0,0.45)",
        crimson: "0 28px 80px rgba(159,35,56,0.18)",
      },
      letterSpacing: {
        editorial: "0.34em",
      },
      fontFamily: {
        body: ["var(--font-app)", "Kalam", "Patrick Hand", "cursive"],
        display: ["var(--font-app)", "Kalam", "Patrick Hand", "cursive"],
        hand: ["var(--font-app)", "Kalam", "Patrick Hand", "cursive"],
      },
      borderRadius: {
        editorial: "2rem",
      },
    },
  },
  plugins: [],
};
