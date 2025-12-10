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
        // Paleta de café
        coffee: {
          50: '#fdf8f6',
          100: '#f2e8e5',
          200: '#eaddd7',
          300: '#e0cec7',
          400: '#d2bab0',
          500: '#bfa094',
          600: '#a18072',
          700: '#977669',
          800: '#846358',
          900: '#43302b',
        },
        espresso: {
          50: '#f9f5f3',
          100: '#ede4df',
          200: '#dcc9bc',
          300: '#c4a48f',
          400: '#ac8167',
          500: '#9a6b4c',
          600: '#8c5a3e',
          700: '#744835',
          800: '#613c2f',
          900: '#3d2520',
        },
        cream: {
          50: '#fffbf5',
          100: '#fff5e6',
          200: '#ffe8c7',
          300: '#ffd89f',
          400: '#ffc267',
          500: '#ffb347',
          600: '#f09819',
          700: '#c87712',
          800: '#9f5d14',
          900: '#824c14',
        },
      },
      fontFamily: {
        'display': ['"Playfair Display"', 'serif'],
        'body': ['"DM Sans"', 'sans-serif'],
      },
      animation: {
        'coffee-fill': 'coffeeFill 25s linear forwards',
        'steam': 'steam 2s ease-in-out infinite',
        'steam-delay': 'steam 2s ease-in-out 0.5s infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        coffeeFill: {
          '0%': { height: '0%' },
          '100%': { height: '100%' },
        },
        steam: {
          '0%, 100%': { 
            opacity: '0',
            transform: 'translateY(0) scaleX(1)'
          },
          '50%': { 
            opacity: '0.6',
            transform: 'translateY(-20px) scaleX(1.2)'
          },
        },
      },
    },
  },
  plugins: [],
}
