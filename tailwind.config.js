/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#FF4B4B',
          600: '#FF4B4B',
          700: '#b91c1c',
        },
        'background-light': '#F8F8F8',
        'background-dark': '#230f0f',
      },
      fontFamily: {
        'display': ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
