import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
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
        ink: '#1f2430',
        surface: '#f7f8fb',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
