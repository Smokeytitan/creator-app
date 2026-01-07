import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/kaito': {
        target: 'https://api.kaito.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/kaito/, '/api/v1'),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('X-API-KEY', 'l5WWSDoert2mCtOH7dfDz5Ni5l7eGJMk4OCJZKXi');
          });
        }
      }
    }
  }
})
