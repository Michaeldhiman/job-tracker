/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        background: 'rgb(var(--color-background) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-elevated': 'rgb(var(--color-surface-elevated) / <alpha-value>)',
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        'primary-hover': 'rgb(var(--color-primary-hover) / <alpha-value>)',
        text: 'rgb(var(--color-text) / <alpha-value>)',
        'text-muted': 'rgb(var(--color-text-muted) / <alpha-value>)',
        border: 'var(--color-border)',
        emerald: {
          500: 'rgb(var(--color-emerald-500) / <alpha-value>)',
          500_10: 'rgba(var(--color-emerald-500) / 0.1)'
        },
        rose: {
          500: 'rgb(var(--color-rose-500) / <alpha-value>)',
          500_10: 'rgba(var(--color-rose-500) / 0.1)'
        },
        amber: {
          500: 'rgb(var(--color-amber-500) / <alpha-value>)',
          500_10: 'rgba(var(--color-amber-500) / 0.1)'
        }
      },
      boxShadow: {
        'glass': '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
