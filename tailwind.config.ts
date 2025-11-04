import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0b1020',
        foreground: '#e6ecff',
        accent: '#6ee7b7',
        muted: '#8aa0c6'
      }
    },
  },
  plugins: [],
} satisfies Config
