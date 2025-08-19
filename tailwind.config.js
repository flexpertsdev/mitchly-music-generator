/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'mitchly-blue': '#0066FF',   // Mitchly brand blue
        'mitchly-purple': '#8B5CF6', // Purple secondary accent
        'mitchly-dark': '#0F0F0F',   // Dark background (Spotify-like)
        'mitchly-darker': '#000000', // Pure black
        'mitchly-gray': '#181818',   // Dark gray for cards
        'mitchly-light-gray': '#282828' // Lighter gray for hover states
      },
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif']
      }
    },
  },
  plugins: [],
}
