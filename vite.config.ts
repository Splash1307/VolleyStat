import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relative pour fonctionner aussi bien en local que sur GitHub Pages
export default defineConfig({
  plugins: [react()],
  base: './',
});
