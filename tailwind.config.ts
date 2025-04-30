/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './pages/**/*.{js,ts,jsx,tsx}',
      './components/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
      extend: {
        colors: {
          background: '#272727',
          foreground: '#f5f5f5',
        },
        fontFamily: {
          instrument: ['var(--font-instrument)', 'sans-serif'],
        },
      },
    },
    plugins: [],
  }
  