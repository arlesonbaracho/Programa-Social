/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js}"],
  theme: {
    extend: {
      colors: {
        shell: "#f4f8ff",
        ink: "#16324f",
        clay: "#ef7d7d",
        forest: "#2f6fed",
        sand: "#e8f0ff",
        mist: "#ffffff",
        line: "#cfe0ff",
        gold: "#7aa6ff",
      },
      fontFamily: {
        display: ["Trebuchet MS", "Segoe UI", "Tahoma", "sans-serif"],
        body: ["Segoe UI", "Tahoma", "Geneva", "Verdana", "sans-serif"],
      },
      boxShadow: {
        card: "0 18px 48px rgba(47, 111, 237, 0.12)",
      },
    },
  },
  plugins: [],
};
