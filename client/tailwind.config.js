/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          dark: '#1D4ED8',
          light: '#3B82F6',
        },
        ink: {
          DEFAULT: '#0F172A', // dark / text
        },
        muted: {
          DEFAULT: '#64748B', // secondary text
        },
        surface: {
          DEFAULT: '#F8FAFC', // background
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.08)',
        cardHover: '0 4px 12px rgba(15, 23, 42, 0.10)',
      },
    },
  },
  plugins: [],
};
