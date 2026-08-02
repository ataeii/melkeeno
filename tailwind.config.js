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
        // Warm gold/amber brand scale, sampled directly from the official
        // ملکینو logo mark — overrides Tailwind's default `blue`, so every
        // existing bg-blue-*/text-blue-* class rebrands in place site-wide.
        blue: {
          50: '#FAF6F0',
          100: '#F4EADC',
          200: '#EAD8BE',
          300: '#DDC197',
          400: '#D2AD74',
          500: '#C89A56',
          600: '#B9873C',
          700: '#926B2F',
          800: '#705124',
          900: '#513B1A',
          950: '#2E220F',
        },
        // Deep navy from the logo mark, used for the logo/wordmark and
        // headings instead of the gold scale above.
        navy: {
          50: '#F0F4FA',
          100: '#DAE5F1',
          200: '#B4CAE4',
          300: '#87ABD4',
          400: '#5689C2',
          500: '#39689D',
          600: '#2E547F',
          700: '#27486D',
          800: '#203A58',
          900: '#182C43',
          950: '#0E1925',
        },
        // Background cream, sampled from the logo mark's backdrop.
        cream: {
          DEFAULT: '#F9F5EC',
          dark: '#EFE6D5',
        },
      },
    },
  },
  plugins: [],
};
