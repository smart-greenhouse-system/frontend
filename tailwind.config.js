/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          'farm-green': {
            light: '#e8f5e9',
            DEFAULT: '#2d6a2d',
            dark: '#1b431b',
          },
        },
      },
    },
    plugins: [],
  }