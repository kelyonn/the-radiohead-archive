import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // relative paths so the build works on GitHub Pages sub-paths
  build: { target: 'es2020', chunkSizeWarningLimit: 800 },
});
