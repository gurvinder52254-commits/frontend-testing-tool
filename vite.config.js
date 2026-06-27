import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',                            // Render ke liye zaroori: 0.0.0.0 par bind karo
    port: parseInt(process.env.PORT) || 5173,   // Render ka PORT env variable use karo
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',                            // 'npm run preview' ke liye bhi 0.0.0.0
    port: parseInt(process.env.PORT) || 4173,
  },
});
