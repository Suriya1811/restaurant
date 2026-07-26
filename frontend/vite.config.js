import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    alias: { '@': path.resolve(__dirname, './src') }
  },
  server: {
    hmr: { overlay: false },
    proxy: {
      // Dev: proxy /api calls to Express backend
      '/api': { target: 'http://localhost:5055', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5055', changeOrigin: true }
    }
  },
  build: {
    minify: 'esbuild',
    target: 'es2015',
    // base './' so asset paths work when served from Express as static files
    // (keeps paths relative so index.html can be anywhere)
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'redux-vendor': ['@reduxjs/toolkit', 'react-redux'],
          'ui-vendor': ['framer-motion', 'lucide-react']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})