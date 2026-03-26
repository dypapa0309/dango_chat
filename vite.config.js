import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: '.',
  build: {
    outDir: 'app',
    emptyOutDir: false,
    assetsDir: 'react-assets',
    rollupOptions: {
      input: './index.html',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve('./src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/.netlify/functions': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
    },
  },
})
