import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    federation({
      name: 'legacyFrontend',
      filename: 'remoteEntry.js',
      exposes: {
        './LegacyFrontend': './src/LegacyFrontend.jsx',
      },
    }),
  ],
  server: {
    port: 5173,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'esnext',
  },
});
