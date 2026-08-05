import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const rootDir = fileURLToPath(new URL('./', import.meta.url))

export default defineConfig({
  root: rootDir,
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests-render/setup.js'],
    include: ['tests-render/**/*.test.jsx'],
  },
})
