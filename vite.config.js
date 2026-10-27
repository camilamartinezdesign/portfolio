import { defineConfig } from 'vite';

// Static landing: index.html at the root, source in src/, and everything that
// must ship as-is (media, images, CNAME) in public/.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
