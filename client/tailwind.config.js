/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          DEFAULT: '#09090B', // Carbon Obsidian
          accent: '#2563EB',  // Brand Blue
          accentDark: '#1D4ED8', // Dark Brand Blue
        },
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#2563EB',
          DEFAULT: '#2563EB', // Brand Blue
          600: '#1D4ED8',
          dark: '#1D4ED8',    // Dark Brand Blue
          700: '#1E40AF',
          800: '#1E3A8A',
          900: '#172554',
          light: '#3B82F6',
        },
        ink: {
          DEFAULT: '#09090B', // Carbon Obsidian - Strong Headings & Brand
          dark: '#000000',    // Pure Black
          heading: '#18181B', // Pure Ink - Section Titles & Subheadings
          light: '#27272A',   // Zinc 800 - Body Text
          subtle: '#52525B',  // Zinc 600 - Secondary
        },
        muted: {
          DEFAULT: '#71717A', // Muted Text - Secondary text & labels
          light: '#A1A1AA',   // Soft Muted - Placeholders, subtle icons
          dark: '#52525B',    // Dark Muted
        },
        surface: {
          DEFAULT: '#F3F0EA', // Primary Canvas (Warm Stone / Ivory)
          secondary: '#EAE6DE', // Secondary Warm Surface (Subtle alternating sections)
          card: '#FAF9F6',    // Soft Card Surface (Warm elevated card surface)
          white: '#FFFFFF',   // Pure White (selective use)
          muted: '#EAE6DE',   // Warm subtle fills, pill tags
          border: '#DDD9D1',  // Warm hairline border
          subtle: '#EFECE5',
        },
        success: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          500: '#10B981',
          DEFAULT: '#059669',
          600: '#059669',
          700: '#047857',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          DEFAULT: '#D97706',
          600: '#D97706',
          700: '#B45309',
        },
        error: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#EF4444',
          DEFAULT: '#DC2626',
          600: '#DC2626',
          700: '#B91C1C',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.03), 0 1px 2px -1px rgba(0, 0, 0, 0.02)',
        cardHover: '0 10px 25px -5px rgba(0, 0, 0, 0.06), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
        dropdown: '0 12px 24px -4px rgba(0, 0, 0, 0.08), 0 6px 12px -6px rgba(0, 0, 0, 0.03)',
        modal: '0 25px 50px -12px rgba(0, 0, 0, 0.20)',
        glow: '0 0 24px -4px rgba(37, 99, 235, 0.20)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      maxWidth: {
        '8xl': '88rem',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
