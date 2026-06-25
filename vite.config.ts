import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const appVersion =
  process.env.VITE_APP_VERSION ||
  process.env.COMMIT_SHA ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  String(Date.now())

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'falconext-version-file',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: JSON.stringify({
            version: appVersion,
            builtAt: new Date().toISOString(),
          }),
        })
      },
    },
  ],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
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
  optimizeDeps: {
    include: ['@monaco-editor/react'],
  },
})
