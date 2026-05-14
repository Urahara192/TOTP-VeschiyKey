/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        cormorant: ['Cormorant Garamond', 'serif'],
      },
      colors: {
        slate: {
          50: '#FDF8F0',
          100: '#F5E6D3',
          200: '#EDE0D4',
          300: '#D4C4B0',
          400: '#B8A58E',
          500: '#9C8A72',
          600: '#7D6B55',
          700: '#5E4E3C',
          800: '#3E3227',
          900: '#2D1810',
          950: '#1A0F0A',
        },
      },
    },
  },
  plugins: [],
}
