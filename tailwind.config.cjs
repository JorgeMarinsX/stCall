module.exports = {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.{vue,js,ts}',
    './pages/**/*.{vue,js,ts}',
    './app.vue',
    './composables/**/*.{js,ts}',
    './plugins/**/*.{js,ts}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'rgb(from var(--p-primary-50) r g b / <alpha-value>)',
          100: 'rgb(from var(--p-primary-100) r g b / <alpha-value>)',
          200: 'rgb(from var(--p-primary-200) r g b / <alpha-value>)',
          300: 'rgb(from var(--p-primary-300) r g b / <alpha-value>)',
          400: 'rgb(from var(--p-primary-400) r g b / <alpha-value>)',
          500: 'rgb(from var(--p-primary-500) r g b / <alpha-value>)',
          600: 'rgb(from var(--p-primary-600) r g b / <alpha-value>)',
          700: 'rgb(from var(--p-primary-700) r g b / <alpha-value>)',
          800: 'rgb(from var(--p-primary-800) r g b / <alpha-value>)',
          900: 'rgb(from var(--p-primary-900) r g b / <alpha-value>)',
          950: 'rgb(from var(--p-primary-950) r g b / <alpha-value>)'
        }
      }
    },
  },
  plugins: [],
};