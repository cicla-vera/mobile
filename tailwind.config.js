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
          shell: '#F7E6DB',
          ink: '#141011',
          coffee: '#2F2522',
          blue: '#20257B',
          plum: '#4A225E',
          pink: '#C949A8',
          coral: '#F2617E',
          sky: '#209ED0',
          mint: '#8ECFB8',
          muted: '#635957',
          soft: '#A69A96',
          danger: '#B42342',
        },
      },
      borderRadius: {
        vera: '12px',
      },
    },
  },
  plugins: [],
};
