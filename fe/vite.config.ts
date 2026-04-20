import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Fix __dirname cho ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@assets': resolve(__dirname, './src/assets'),
      '@components': resolve(__dirname, './src/components'),
      '@config': resolve(__dirname, './src/config'),
      '@constants': resolve(__dirname, './src/constants'),
      '@contexts': resolve(__dirname, './src/contexts'),
      '@features': resolve(__dirname, './src/features'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@lib': resolve(__dirname, './src/lib'),
      '@pages': resolve(__dirname, './src/pages'),
      '@routes': resolve(__dirname, './src/routes'),
      '@services': resolve(__dirname, './src/services'),
      '@store': resolve(__dirname, './src/store'),
      '@styles': resolve(__dirname, './src/styles'),
      '@types': resolve(__dirname, './src/types'),
      '@utils': resolve(__dirname, './src/utils'),
    },
  },

  server: {
    port: 5175,
    strictPort: false,

    proxy: {
      '/api': {
        target: 'http://localhost:8888',
        changeOrigin: true,
        secure: false,

        // giữ nguyên path /api (không cần rewrite)
        rewrite: (path) => path,

        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('❌ Proxy error:', err.message);
          });

          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('➡️ Request:', req.method, req.url);
          });

          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('⬅️ Response:', proxyRes.statusCode, req.url);
          });
        },
      },
    },

    fs: {
      allow: ['..'],
    },
  },

  build: {
    sourcemap: false,

    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
        },
      },
    },

    chunkSizeWarningLimit: 600,
    minify: 'esbuild',
  },

  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});