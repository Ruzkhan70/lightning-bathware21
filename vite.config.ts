import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: '/',
  assetsInclude: ['**/*.svg', '**/*.csv'],
  esbuild: {
    keepNames: true,
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        dead_code: true,
        drop_console: false,
      },
    },
  },
})
