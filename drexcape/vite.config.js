import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isDevelopment = command === 'serve' || mode === 'development';
  
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            mui: ['@mui/material', '@mui/icons-material'],
          },
        },
      },
    },
    publicDir: 'public',
    server: isDevelopment ? {
      port: 3000,
      proxy: {
        '/api': {
          // Development Configuration - only use proxy in development
          target: 'http://localhost:3001',
          changeOrigin: true,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
          timeout: 30000,
          limit: '10mb'
        },
      },
    } : {},
    preview: {
      port: 3000,
      // Disable proxy in preview/production
      proxy: {}
    },
  }
})
