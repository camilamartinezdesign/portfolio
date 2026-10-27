import { defineConfig } from 'vite';
import { cpSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

// index.html loads classic (non-module) scripts and points <image-slot> at files
// by plain path, and image-slot.js fetches .image-slots.state.json at runtime.
// Vite doesn't bundle or copy any of that, so copy it into dist after the build.
const STATIC_FILES = [
  'support.js',
  'image-slot.js',
  'video-slot.js',
  '.image-slots.state.json',
  'CNAME',
  'media',
];

function copyStaticAssets() {
  let outDir;
  return {
    name: 'copy-static-assets',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const rootImages = readdirSync(import.meta.dirname).filter((f) => /\.(png|jpe?g|webp|avif|gif)$/i.test(f));
      for (const f of [...STATIC_FILES, ...rootImages]) {
        cpSync(resolve(import.meta.dirname, f), resolve(outDir, f), { recursive: true });
      }
    },
  };
}

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  plugins: [copyStaticAssets()],
});
