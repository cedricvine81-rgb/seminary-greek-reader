import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        greek: ['Gentium Plus', 'GFS Didot', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        parchment: {
          50: '#fdfaf4',
          100: '#faf3e0',
          200: '#f4e4b8',
          300: '#ecd490',
          400: '#e0be60',
          500: '#d4a832',
        },
        ink: {
          50: '#f4f4f5',
          900: '#18181b',
        },
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      typography: {
        greek: {
          css: {
            fontSize: '1.125rem',
            lineHeight: '1.8',
            letterSpacing: '0.01em',
          },
        },
      },
    },
  },
  plugins: [],
}

export default config
