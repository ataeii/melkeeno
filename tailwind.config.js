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
        // Warm gold/amber brand scale (from the melkeeno hero photo shoot)
        // — overrides Tailwind's default `blue`, so every existing
        // bg-blue-*/text-blue-* class rebrands in place across the site.
        blue: {
          50: '#FAF6EF',
          100: '#F4EBDD',
          200: '#E8D9BF',
          300: '#D9C29B',
          400: '#CAAD7D',
          500: '#BD9D65',
          600: '#A9844C',
          700: '#8A6838',
          800: '#6A4E29',
          900: '#4E371D',
          950: '#2D1F10',
        },
        // Deep navy, used for the logo/wordmark and headings instead of the
        // gold scale above (matches the two-tone palette from the hero photo).
        navy: {
          50: '#EFF4FB',
          100: '#D7E4F4',
          200: '#B3C9E6',
          300: '#86A8D5',
          400: '#5385C6',
          500: '#3364A3',
          600: '#285086',
          700: '#214573',
          800: '#1D395D',
          900: '#152B47',
          950: '#0B1828',
        },
        cream: {
          DEFAULT: '#F7F0E7',
          dark: '#EEE3D2',
        },
      },
    },
  },
  plugins: [],
};
