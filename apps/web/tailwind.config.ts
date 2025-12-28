import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Auto-branded colors from CSS variables
        primary: {
          DEFAULT: 'var(--color-primary, #2B579A)',
          50: 'var(--color-primary-50, #EBF0F7)',
          100: 'var(--color-primary-100, #D6E1EF)',
          200: 'var(--color-primary-200, #AEC3DF)',
          300: 'var(--color-primary-300, #85A5CF)',
          400: 'var(--color-primary-400, #5D87BF)',
          500: 'var(--color-primary-500, #2B579A)',
          600: 'var(--color-primary-600, #234A82)',
          700: 'var(--color-primary-700, #1A3C6A)',
          800: 'var(--color-primary-800, #122D52)',
          900: 'var(--color-primary-900, #0F1F35)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary, #4472C4)',
        },
        accent: {
          DEFAULT: 'var(--color-accent, #70AD47)',
        },

        // System colors
        background: 'var(--background, #F5F5F7)',
        surface: 'var(--surface, rgba(255, 255, 255, 0.7))',
        border: 'var(--border, rgba(255, 255, 255, 0.2))',
      },

      backdropBlur: {
        xs: '2px',
      },

      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.08)',
        'glass-hover': '0 12px 40px rgba(0, 0, 0, 0.12)',
      },

      borderRadius: {
        '4xl': '2rem',
      },

      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
