import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-phaser': ['phaser'],
          'vendor-charts': ['recharts'],
          'vendor-ui': ['framer-motion', 'lucide-react', 'canvas-confetti'],
          'vendor-socket': ['socket.io-client']
        }
      }
    }
  },
  server: {
    port: 5173,
    host: '0.0.0.0', // Listen on 0.0.0.0 for LAN / multi-device Wi-Fi access
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://127.0.0.1:5001',
        ws: true
      }
    }
  }
});

