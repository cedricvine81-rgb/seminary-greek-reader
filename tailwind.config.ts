import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    // Color palettes (note-colors.ts, highlight-colors.ts) keep literal Tailwind class
    // names in data objects rather than component files — src/lib wasn't scanned before,
    // so those classes were silently never generated.
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        greek: ['Gentium Plus', 'GFS Didot', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Neutral / brand / parchment ramps are backed by CSS variables (see
        // globals.css) so every utility using them re-themes with <html data-theme>.
        // `<alpha-value>` keeps `/opacity` modifiers (e.g. bg-surface/80) working.
        gray: {
          50:  'rgb(var(--gray-50) / <alpha-value>)',
          100: 'rgb(var(--gray-100) / <alpha-value>)',
          200: 'rgb(var(--gray-200) / <alpha-value>)',
          300: 'rgb(var(--gray-300) / <alpha-value>)',
          400: 'rgb(var(--gray-400) / <alpha-value>)',
          500: 'rgb(var(--gray-500) / <alpha-value>)',
          600: 'rgb(var(--gray-600) / <alpha-value>)',
          700: 'rgb(var(--gray-700) / <alpha-value>)',
          800: 'rgb(var(--gray-800) / <alpha-value>)',
          900: 'rgb(var(--gray-900) / <alpha-value>)',
        },
        // Card / panel background (was literal bg-white; swept to bg-surface).
        surface: 'rgb(var(--surface) / <alpha-value>)',
        // Floating pop-outs (menus, note & right-click popovers, dialogs) — a
        // distinct raised surface so they stand out from the page/cards.
        popover: 'rgb(var(--popover) / <alpha-value>)',
        // App header bar — a touch lighter than the page in every theme.
        topbar: 'rgb(var(--topbar) / <alpha-value>)',
        // Text-entry fields (matches the header off-white on the sepia palette).
        input: 'rgb(var(--input) / <alpha-value>)',
        // Form feedback (see FormMessage) — themed so "Saved."/error boxes are
        // readable on the dark palettes instead of glowing light-green/red.
        success: {
          bg: 'rgb(var(--success-bg) / <alpha-value>)',
          fg: 'rgb(var(--success-fg) / <alpha-value>)',
        },
        danger: {
          bg: 'rgb(var(--danger-bg) / <alpha-value>)',
          fg: 'rgb(var(--danger-fg) / <alpha-value>)',
        },
        parchment: {
          50:  'rgb(var(--parchment-50) / <alpha-value>)',
          100: 'rgb(var(--parchment-100) / <alpha-value>)',
          200: 'rgb(var(--parchment-200) / <alpha-value>)',
          300: 'rgb(var(--parchment-300) / <alpha-value>)',
          400: 'rgb(var(--parchment-400) / <alpha-value>)',
          500: 'rgb(var(--parchment-500) / <alpha-value>)',
        },
        ink: {
          50:  'rgb(var(--ink-50) / <alpha-value>)',
          900: 'rgb(var(--ink-900) / <alpha-value>)',
        },
        brand: {
          50:  'rgb(var(--brand-50) / <alpha-value>)',
          100: 'rgb(var(--brand-100) / <alpha-value>)',
          200: 'rgb(var(--brand-200) / <alpha-value>)',
          300: 'rgb(var(--brand-300) / <alpha-value>)',
          400: 'rgb(var(--brand-400) / <alpha-value>)',
          500: 'rgb(var(--brand-500) / <alpha-value>)',
          600: 'rgb(var(--brand-600) / <alpha-value>)',
          700: 'rgb(var(--brand-700) / <alpha-value>)',
          800: 'rgb(var(--brand-800) / <alpha-value>)',
          900: 'rgb(var(--brand-900) / <alpha-value>)',
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
