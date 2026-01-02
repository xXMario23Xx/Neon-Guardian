
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Importante para GitHub Pages
  build: {
    outDir: 'dist',
  },
  define: {
    'process.env': {} // Evita errores de process en el navegador
  }
});
