/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Semantic dynamic tokens mapped to CSS custom variables
        primary: {
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          200: 'var(--color-primary-200)',
          300: 'var(--color-primary-300)',
          400: 'var(--color-primary-400)',
          500: 'var(--color-accent)',
          DEFAULT: 'var(--color-accent)',
          600: 'var(--color-accent-hover)',
          dark: 'var(--color-accent-hover)',
          700: 'var(--color-accent-hover)',
          800: 'var(--color-accent-hover)',
          900: 'var(--color-accent-hover)',
          light: 'var(--color-accent-light)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          light: 'var(--color-accent-light)',
          ink: 'var(--color-accent-ink)',
        },
        highlight: {
          DEFAULT: 'var(--color-highlight)',
          ink: 'var(--color-highlight-ink)',
        },
        // Typography hierarchy (Adapts seamlessly between light and dark)
        ink: {
          DEFAULT: 'var(--color-text-primary)',
          dark: 'var(--color-text-primary)',
          heading: 'var(--color-text-primary)',
          light: 'var(--color-text-body)',
          subtle: 'var(--color-text-tertiary)',
        },
        // Secondary / Tertiary text tokens
        muted: {
          DEFAULT: 'var(--color-text-secondary)',
          light: 'var(--color-text-secondary)',
          dark: 'var(--color-text-tertiary)',
        },
        // Surface Tiers
        surface: {
          DEFAULT: 'var(--color-bg-base)',
          secondary: 'var(--color-bg-card)',
          card: 'var(--color-bg-card)',
          elevated: 'var(--color-bg-elevated)',
          soft: 'var(--color-bg-soft)',
          hero: 'var(--color-bg-hero)',
          muted: 'var(--color-bg-elevated)',
          border: 'var(--color-border-subtle)',
          borderStrong: 'var(--color-border-strong)',
          subtle: 'var(--color-bg-elevated)',
          white: 'var(--color-bg-card)',
        },
        card: {
          DEFAULT: 'var(--color-bg-card)',
          elevated: 'var(--color-bg-elevated)',
          soft: 'var(--color-bg-soft)',
          hero: 'var(--color-bg-hero)',
        },
        border: {
          DEFAULT: 'var(--color-border-subtle)',
          subtle: 'var(--color-border-subtle)',
          strong: 'var(--color-border-strong)',
        },
        // Status & Alerts
        success: {
          50: 'var(--color-success-bg)',
          100: 'var(--color-success-bg)',
          500: 'var(--color-success)',
          DEFAULT: 'var(--color-success)',
          600: 'var(--color-success)',
          700: 'var(--color-success)',
        },
        warning: {
          50: '#FEF3C7',
          100: '#FDE68A',
          500: '#F59E0B',
          DEFAULT: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        error: {
          50: 'var(--color-danger-bg)',
          100: 'var(--color-danger-bg)',
          500: 'var(--color-danger)',
          DEFAULT: 'var(--color-danger)',
          600: 'var(--color-danger)',
          700: 'var(--color-danger)',
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
          hover: 'var(--color-danger-hover)',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['"Inter"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
        xs: '0 1px 3px 0 rgba(0, 0, 0, 0.5)',
        sm: '0 2px 4px 0 rgba(0, 0, 0, 0.5)',
        card: 'none',
        cardHover: 'none',
        dropdown: '0 12px 32px 0 rgba(0, 0, 0, 0.7)',
        modal: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
        glow: '0 0 24px -4px rgba(215, 255, 61, 0.35)',
      },
      borderRadius: {
        lg: '10px',
        xl: '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
        '10xl': '108rem',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        marquee: 'marquee 28s linear infinite',
        'marquee-fast': 'marquee 16s linear infinite',
      },
    },
  },
  plugins: [],
};
