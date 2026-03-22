import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f5f5f5',
          100: '#e0e0e0',
          200: '#b8b8b8',
          300: '#8a8a8a',
          400: '#5c5c5c',
          500: '#3d3d3d',
          600: '#2e2e2e',
          700: '#1f1f1f',
          800: '#141414',
          900: '#0a0a0a',
        },
        gold: {
          50: '#fdf8ed',
          100: '#f9edcc',
          200: '#f2d88a',
          300: '#e6c04d',
          400: '#d4a82a',
          500: '#c8962a',
          600: '#b07d1e',
          700: '#8f6316',
          800: '#704d12',
          900: '#573b0e',
        },
        silver: {
          50: '#fafafa',
          100: '#f0f0f0',
          200: '#e4e4e4',
          300: '#d1d1d1',
          400: '#b4b4b4',
          500: '#9a9a9a',
          600: '#818181',
          700: '#6a6a6a',
          800: '#515151',
          900: '#3b3b3b',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
export default config
