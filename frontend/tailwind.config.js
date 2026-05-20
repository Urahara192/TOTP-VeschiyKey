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
          50: '#f1f5f9',
          100: '#e2e8f0',
          200: '#cbd5e1',
          300: '#94a3b8',
          400: '#64748b',
          500: '#475569',
          600: '#334155',
          700: '#1e293b',
          800: '#1a2332',
          900: '#0f172a',
          950: '#0a0f1a',
        },
      },
    },
  },
  plugins: [],
}
