import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [],
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: process.env.VERCEL ? '/' : '/lightning-bathware21',
  assetsInclude: ['**/*.svg', '**/*.csv'],
  optimizeDeps: {
    include: ['firebase', 'firebase/firestore', 'firebase/app'],
  },
  esbuild: {
    keepNames: true,
  },
  build: {
    minify: 'esbuild',
  },
})
