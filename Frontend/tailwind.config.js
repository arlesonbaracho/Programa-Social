/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js}"],
  theme: {
    extend: {
      colors: {
        shell: "#f5efe3",
        ink: "#1d2a26",
        clay: "#b15f3d",
        forest: "#315847",
        sand: "#e6dcc7",
        mist: "#f8f3ea",
        line: "#d6c8ab",
        gold: "#a67c28",
      },
      fontFamily: {
        display: ["Georgia", "Cambria", "Times New Roman", "serif"],
        body: ["Segoe UI", "Tahoma", "Geneva", "Verdana", "sans-serif"],
      },
      boxShadow: {
        card: "0 18px 40px rgba(41, 56, 50, 0.12)",
      },
    },
  },
  plugins: [],
};
