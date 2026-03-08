/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'hex-green': '#00ff00',
        'hex-dark': '#0a0a0a',
        'hex-gray': '#1a1a1a',
      }
    },
  },
  plugins: [],
}
