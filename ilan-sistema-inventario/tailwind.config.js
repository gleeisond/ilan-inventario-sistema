/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Cores do manual de marca Genesis41 (marca/README.md)
      colors: {
        grafite: '#11141A',
        ouro: '#E0AE4E',
        'ouro-escuro': '#A97A18',
        papel: '#F4F3EF',
        tinta: '#16181D',
        nevoa: '#F2F1EC',
        cinza: '#5A5D66',
        linha: '#E1E0DA',
      },
      fontFamily: {
        display: ['Sora', 'Trebuchet MS', 'sans-serif'],
        sans: ['Figtree', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['IBM Plex Mono', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
