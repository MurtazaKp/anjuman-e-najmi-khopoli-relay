import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          800: '#1b365d',
          900: '#11223e',
          950: '#0a1628',
        },
        gold: {
          400: '#e5aa52',
          500: '#d4943c',
          600: '#c68a36',
          700: '#b3782b',
        },
        cream: {
          50: '#faf7f2',
          100: '#f5f0e6',
          200: '#eae3d5',
          300: '#e2d3b7',
        },
      },
    },
  },
  plugins: [],
};
export default config;
