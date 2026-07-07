/** @type {import('tailwindcss').Config} */

// Theme-aware palettes. The slate scale and surfaces resolve to CSS variables
// (see index.css) so the whole app flips to dark mode when `.dark` is set on
// <html> — pages keep using ordinary `slate-*` classes. The `<alpha-value>`
// form keeps opacity modifiers (e.g. bg-slate-50/60) working.
const varColor = (name) => `rgb(var(--${name}) / <alpha-value>)`;
const scale = (name, steps) =>
  Object.fromEntries(steps.map((s) => [s, varColor(`${name}-${s}`)]));

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        // Job Master brand palette (per brand guide).
        navy: '#00182a', // Deep Navy — constant in both themes.
        slategray: '#647488', // Slate Gray
        success: '#22c55e', // Success Green
        alert: '#f59e0b', // Alert Orange
        // Card/panel background: white in light mode, dark slate in dark mode.
        surface: varColor('surface'),
        slate: scale('slate', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]),
        // The interactive accent — configurable in Settings (blue/green/violet).
        brand: scale('brand', [50, 100, 500, 600, 700, 800, 900]),
      },
    },
  },
  plugins: [],
};
