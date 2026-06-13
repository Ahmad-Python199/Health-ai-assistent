/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // support class-based dark mode
  theme: {
    extend: {
      colors: {
        health: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        brand: {
          deep: '#0b0f19',
          card: '#161e31',
          primary: '#6366f1', // Indigo
          accent: '#06b6d4',  // Cyan
          warning: '#f59e0b', // Amber
          danger: '#ef4444',  // Red
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-hover': '0 8px 32px 0 rgba(99, 102, 241, 0.45)',
      }
    },
  },
  plugins: [],
}
