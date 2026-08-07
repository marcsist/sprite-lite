import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/sprite-lite/',
  build: {
    outDir: 'dist-demo',
    emptyOutDir: true,
  },
})
