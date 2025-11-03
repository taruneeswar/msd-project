/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        eco: {
          green: '#16a34a',
          dark: '#0f5132',
          light: '#d1fae5'
        }
      }
    },
  },
  plugins: [],
}
