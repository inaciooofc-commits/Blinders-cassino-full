import { defineConfig } from 'vite';
export default defineConfig({
  appType: 'spa',
  build: {
    target: 'es2020',
    sourcemap: false,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: { manualChunks: { vendor: ['pixi.js', 'gsap', 'chart.js', 'howler', '@supabase/supabase-js'] } }
    }
  }
});
