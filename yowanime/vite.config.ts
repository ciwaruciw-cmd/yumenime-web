import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    host: true, // Listen on all local IP addresses (0.0.0.0) for mobile access
    port: 5173,
  },
  build: {
    // Target modern browsers — smaller output
    target: 'es2020',
    // Inline assets smaller than 4KB
    assetsInlineLimit: 4096,
    // CSS code splitting
    cssCodeSplit: true,
    // Manual chunk splitting — separates vendor libs from app code
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-player')) return 'player';
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'react-vendor';
          if (id.includes('node_modules/react-router-dom') || id.includes('node_modules/react-router/') || id.includes('node_modules/@remix-run')) return 'router';
          if (id.includes('node_modules/zustand')) return 'state';
        },
        // Consistent file names for long-term caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Warn on chunks > 500KB
    chunkSizeWarningLimit: 500,
  },
})
