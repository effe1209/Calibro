import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('/node_modules/')) return undefined;

          const packagePath = id.split('/node_modules/')[1];
          if (/^(react|react-dom|scheduler)(\/|$)/.test(packagePath)) return 'vendor-react';
          if (/^(@mui|@emotion)\//.test(packagePath)) return 'vendor-ui';
          if (/^(@react-three\/fiber|three|ogl|gl-matrix)(\/|$)/.test(packagePath)) return 'vendor-graphics';
          if (/^(@supabase)\//.test(packagePath)) return 'vendor-data';
          if (/^(chart\.js|react-chartjs-2)(\/|$)/.test(packagePath)) return 'vendor-charts';
          if (/^(framer-motion|motion)(\/|$)/.test(packagePath)) return 'vendor-motion';
          if (/^(@capacitor)\//.test(packagePath)) return 'vendor-capacitor';

          return undefined;
        },
      },
    },
  },
});
