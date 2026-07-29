/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Vazirmatn', 'sans-serif'],
      },
      gridTemplateColumns: {
        '70/30': '70% 28%',
      },
      colors: {
        // Zillow-inspired blue scale — overrides Tailwind's default `blue`,
        // so every existing bg-blue-*/text-blue-* class rebrands in place.
        blue: {
          50: '#eaf3ff',
          100: '#d3e6ff',
          200: '#a8cdff',
          300: '#71acff',
          400: '#3d8bff',
          500: '#0064d2',
          600: '#0052ab',
          700: '#004085',
          800: '#032f61',
          900: '#062442',
          950: '#03142a',
        },
      },
    },
  },
  plugins: [],
};
