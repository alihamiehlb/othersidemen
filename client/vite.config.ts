import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const rootNodeModules = path.resolve(__dirname, '../node_modules')

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      react: path.resolve(rootNodeModules, 'react'),
      'react-dom': path.resolve(rootNodeModules, 'react-dom'),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
  },
  server: {
    port: 5173,
    strictPort: false,
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  envDir: path.resolve(__dirname, '..'),
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
