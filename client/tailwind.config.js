/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        pink: {
          50: '#fff0f3',
          100: '#ffdde3',
          200: '#ffbeca',
          300: '#ff8fa3',
          400: '#ff5c7d',
          500: '#ff2a55',
          600: '#e60e3a',
          700: '#c1042a',
          800: '#a00627',
          900: '#850a24',
        },
        purple: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        }
      },
      fontFamily: {
        outfit: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'bubble-float': 'bubble-float 4s ease-out forwards',
        'spin-slow': 'spin 15s linear infinite',
      },
      keyframes: {
        'bubble-float': {
          '0%': { transform: 'translateY(100vh) scale(0.5)', opacity: '0' },
          '10%': { opacity: '0.8' },
          '90%': { opacity: '0.8' },
          '100%': { transform: 'translateY(-10vh) scale(1.2)', opacity: '0' },
        }
      }
    },
  },
  plugins: [],
}
