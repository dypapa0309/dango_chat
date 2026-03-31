import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'app',
  build: {
    outDir: 'app-native',
    emptyOutDir: true,
    assetsDir: 'react-assets',
    rollupOptions: {
      input: { index: './index-app.html' },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve('./src'),
    },
  },
})
