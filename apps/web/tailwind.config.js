/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // 3xl: monitores ultrawide / 4K. Cards, pósters y paddings crecen en vez de
      // dejar la pantalla medio vacía.
      screens: {
        "3xl": "2200px",
      },
      colors: {
        // Paleta neutra del hub. Superficie + acento.
        surface: {
          DEFAULT: "#0b0d12",
          raised: "#141821",
          border: "#232936",
        },
        accent: {
          DEFAULT: "#6366f1",
          hover: "#818cf8",
        },
      },
    },
  },
  plugins: [],
};
