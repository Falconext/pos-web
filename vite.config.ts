import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  server: {
    port: 5174,
    host: '0.0.0.0',
    open: 'http://app.jamble.peru:5174/login',
    strictPort: true,
    allowedHosts: ['app.jamble.peru'],
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
