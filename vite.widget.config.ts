import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// This config builds Sunny as an embeddable widget
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    outDir: 'dist/widget',
    lib: {
      entry: 'src/widget.tsx',
      name: 'SunnyHarper',
      fileName: 'sunny-harper',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        // Bundle everything into one file
        inlineDynamicImports: true,
      },
    },
  },
});
