import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  base: './', // CRITICAL: Use relative paths for Electron
  
  // Optimize dependencies for faster dev startup
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'lucide-react',
      'xterm',
      'xterm-addon-fit',
      'xterm-addon-web-links',
      'prismjs'
    ]
  },
  
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/setupTests.js',
      ]
    }
  },
  
  build: {
    sourcemap: false,
    minify: 'terser',
    target: 'esnext',
    
    rollupOptions: {
      output: {
        // Use default chunking strategy to let Rollup execute the most optimal graph
        // Removed manualChunks to avoid circular dependencies and initialization errors
        manualChunks: undefined,
        
        exports: 'named',
        inlineDynamicImports: false
      }
    },
    
    chunkSizeWarningLimit: 1200,
    
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    }
  }
});
