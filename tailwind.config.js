/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f5f5f7',
          100: '#e8e8ec',
          200: '#c9c9d1',
          300: '#a3a3b0',
          400: '#6e6e7c',
          500: '#4a4a57',
          600: '#33333e',
          700: '#22222b',
          800: '#16161c',
          900: '#0b0b10',
          950: '#050508',
        },
        gold: {
          50: '#fbf7ee',
          100: '#f6edd4',
          200: '#ecd9a8',
          300: '#e0bf76',
          400: '#d4a249',
          500: '#c98a2e',
          600: '#a96d23',
          700: '#85521e',
          800: '#5f3c18',
          900: '#3d2812',
        },
        accent: {
          400: '#e8c879',
          500: '#d4a249',
          600: '#b8862e',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        'ultra-wide': '0.35em',
      },
      animation: {
        'fade-in': 'fadeIn 1.2s ease-out forwards',
        'shimmer': 'shimmer 2.5s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'grain': 'grain 8s steps(10) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0.001' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        grain: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '10%': { transform: 'translate(-5%, -5%)' },
          '20%': { transform: 'translate(-10%, 5%)' },
          '30%': { transform: 'translate(5%, -10%)' },
          '40%': { transform: 'translate(-5%, 10%)' },
          '50%': { transform: 'translate(-10%, 5%)' },
          '60%': { transform: 'translate(10%, 0%)' },
          '70%': { transform: 'translate(-10%, -5%)' },
          '80%': { transform: 'translate(5%, 10%)' },
          '90%': { transform: 'translate(-5%, -10%)' },
        },
      },
    },
  },
  plugins: [],
};
