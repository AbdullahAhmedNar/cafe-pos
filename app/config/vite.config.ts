import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// إصلاح المسارات لـ Windows
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, '../src/renderer'),
  base: './',
  build: {
    outDir: path.resolve(__dirname, '../dist/renderer'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src/renderer'),
    },
  },
  server: {
    port: 5173,
  },
});
