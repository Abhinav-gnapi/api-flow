import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';

export default defineConfig({
  // Keep root-based asset URLs so hosts can consume:
  //   https://<frontend-domain>/remoteEntry.js
  base: '/',
  plugins: [
    react(),
    federation({
      name: 'legacyFrontend',
      filename: 'remoteEntry.js',
      manifest: true,
      exposes: {
        './LegacyFrontend': './src/LegacyFrontend.jsx',
      },
      shared: {
        react: {
          singleton: true,
        },
        'react-dom': {
          singleton: true,
        },
        'react-router-dom': {
          singleton: true,
        },
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
