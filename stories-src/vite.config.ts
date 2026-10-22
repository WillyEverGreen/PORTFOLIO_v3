import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// Builds the case study into the static portfolio at ../clip, with absolute asset paths
// under /clip/ (Vercel strips trailing slashes, so asset paths must be absolute).
export default defineConfig({
  base: '/clip/',
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  build: {
    outDir: '../clip',
    emptyOutDir: true,
    // split the big libraries out so returning visitors keep them cached between deploys
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-dom/client'],
          motion: ['motion', 'motion/react'],
          gsap: ['gsap', 'gsap/ScrollTrigger', '@gsap/react'],
        },
      },
    },
  },
})
