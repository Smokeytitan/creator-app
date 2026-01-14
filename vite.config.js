import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Add timestamp to filenames to bust cache
        entryFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        chunkFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        assetFileNames: `assets/[name]-[hash]-${Date.now()}.[ext]`
      }
    }
  },
  server: {
    proxy: {
      '/api/kaito': {
        target: 'https://api.kaito.ai',
        changeOrigin: true,
        rewrite: (path) => {
          // /api/kaito?params -> /api/v1/community_mindshare?params
          const newPath = path.replace(/^\/api\/kaito/, '/api/v1/community_mindshare');
          console.log('Vite proxy rewriting:', path, '->', newPath);
          return newPath;
        },
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('X-API-KEY', 'l5WWSDoert2mCtOH7dfDz5Ni5l7eGJMk4OCJZKXi');
            proxyReq.setHeader('Accept', 'application/json');
            proxyReq.setHeader('Accept-Encoding', 'gzip, deflate, br');
          });
        }
      },
      '/api/bot-analytics': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Forward X-API-Key header from client request
            if (req.headers['x-api-key']) {
              proxyReq.setHeader('X-API-Key', req.headers['x-api-key']);
            }
          });
        }
      },
      '/api/admin': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Forward X-API-Key header from client request
            if (req.headers['x-api-key']) {
              proxyReq.setHeader('X-API-Key', req.headers['x-api-key']);
            }
          });
        }
      }
    }
  }
})
