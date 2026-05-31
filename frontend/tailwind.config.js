/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        neon: {
          blue:   '#3b82f6',
          cyan:   '#06b6d4',
          purple: '#a855f7',
          green:  '#10b981',
        },
        glass: {
          bg:        'rgba(255, 255, 255, 0.08)',
          border:    'rgba(255, 255, 255, 0.15)',
          'bg-dark': 'rgba(255, 255, 255, 0.04)',
        },
        gradient: {
          blue:   '#1e3a8a',
          cyan:   '#0e7490',
          purple: '#6b21a8',
        },
      },
      fontFamily: {
        inter: ["'Inter'", 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'gradient-shift': 'gradientShift 12s ease infinite',
        shimmer:          'shimmer 1.5s ease-in-out infinite',
        ripple:           'ripple 600ms linear forwards',
      },
      keyframes: {
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        ripple: {
          '0%':   { transform: 'scale(0)', opacity: '0.4' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
      },
      backdropBlur: {
        sm: '8px',
        md: '12px',
      },
    },
  },
  plugins: [],
};
