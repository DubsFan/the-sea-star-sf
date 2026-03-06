import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sea: {
          dark: '#1a1118',
          darker: '#06080d',
          navy: '#0a0e18',
          gold: '#c9a54e',
          'gold-light': '#dfc06e',
          'gold-dim': '#8f7333',
          blue: '#8a9bb8',
          teal: '#5cb8c4',
          rose: '#c47e7e',
          light: '#d8e0ed',
          white: '#f0f3f8',
          border: '#2d3a52',
        },
        orange: {
          accent: '#e8732a',
        },
      },
      fontFamily: {
        playfair: ['Playfair Display', 'Georgia', 'serif'],
        cormorant: ['Cormorant Garamond', 'Georgia', 'serif'],
        dm: ['DM Sans', 'Helvetica Neue', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
