/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        vera: {
          cream: '#FFF5EC',
          ink: '#141011',
          blue: '#20257B',
          pink: '#C949A8',
          coral: '#F2617E',
          sky: '#209ED0',
          muted: '#635957',
        },
      },
    },
  },
  plugins: [],
};
