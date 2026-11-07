/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        navy: { 950: '#080D1F', 900: '#0C1329', 800: '#131C3A', 700: '#1D2950', 600: '#2B3A6B' },
        ink: '#101A33',
        surface: '#F4F5FA',
        line: '#E2E5EF',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 26, 51, 0.04), 0 1px 3px rgba(16, 26, 51, 0.05)',
        pop: '0 10px 30px -10px rgba(16, 26, 51, 0.25)',
      },
    },
  },
  plugins: [],
};
