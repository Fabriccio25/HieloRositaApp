/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ff5722', // Coralix Orange
        dark: '#1a1a2e',    // Deep Navy
        card: '#16213e',    // Slightly lighter navy
      }
    },
  },
  plugins: [],
}
