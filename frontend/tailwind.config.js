/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        aqi: {
          good: '#10B981',
          satisfactory: '#84CC16',
          moderate: '#F59E0B',
          poor: '#F97316',
          verypoor: '#EF4444',
          severe: '#991B1B',
        },
      },
      boxShadow: {
        glass: '0 10px 36px rgba(3, 6, 20, 0.26)',
        glow: '0 0 42px -8px rgba(34, 211, 238, 0.45)',
      },
    },
  },
  plugins: [],
};
