import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Feminine brand palette (rose / mauve / blush).
        brand: {
          50: '#fdf2f6',
          100: '#fce7ef',
          200: '#fbcfe0',
          300: '#f8a8c6',
          400: '#f272a3',
          500: '#e84882',
          600: '#d42a66',
          700: '#b11d52',
          800: '#931b46',
          900: '#7c1a3e',
        },
        cream: '#fff8f3',
        ink: '#2b2530',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 10px 40px -15px rgba(180, 42, 102, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
