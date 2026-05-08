/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: "#00D084",
          hover: "#00B370",
        },
        secondary: {
          DEFAULT: "#2EC4B6",
        },
        bg: {
          DEFAULT: "#121212",
          card: "#1E1E1E",
        },
        border: "#2A2A2A",
      }
    },
  },
  plugins: [],
}
