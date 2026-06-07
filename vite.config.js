import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  appType: 'spa',
  build: {
    target: 'es2020',
    sourcemap: false,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        manualChunks: {
          pixi: ['pixi.js'],
          vendor: ['gsap', 'chart.js', 'howler', '@supabase/supabase-js']
        }
      }
    }
  }
});
