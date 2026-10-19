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
      // Paleta Genesis41 (ver marca/README.md): o cinza vira os neutros da marca, com o 900 no grafite
      colors: {
        gray: {
          50: '#F4F3EF',
          100: '#ECEBE6',
          200: '#E1E0DA',
          300: '#CDCCC5',
          400: '#9A9CA3',
          500: '#71747C',
          600: '#5A5D66',
          700: '#3C3F47',
          800: '#23262D',
          900: '#11141A',
        },
        // Acento dourado. O 400 é o ouro da marca (texto escuro por cima); do 600 para cima serve como texto sobre fundo claro
        ouro: {
          50: '#FBF6EA',
          100: '#F6EBCF',
          200: '#EDD7A0',
          300: '#E8C57A',
          400: '#E0AE4E',
          500: '#C8952F',
          600: '#946A12',
          700: '#7D5810',
          800: '#5E420C',
          900: '#3F2C08',
        },
      },
      fontFamily: {
        sans: ['var(--fonte-texto)', 'system-ui', 'sans-serif'],
        titulo: ['var(--fonte-titulo)', 'var(--fonte-texto)', 'sans-serif'],
        mono: ['var(--fonte-mono)', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
