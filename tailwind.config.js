import { defineConfig } from 'tailwindcss';

export default defineConfig({
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gold: '#FFD700',
        silver: '#C0C0C0',
        neon: '#39FF14',
        glass: 'rgba(255,255,255,0.08)',
      },
      boxShadow: {
        glass: '0 4px 32px 0 rgba(255,255,255,0.12)',
        gold: '0 0 8px 2px #FFD700',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
});
