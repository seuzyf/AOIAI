import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3001, // 前端继续使用 3001 端口，配合 Nginx 路由
        host: '0.0.0.0',
        allowedHosts: ['aiplatform.make.huawei.com'],
        proxy: {
          // 精准代理，转发到真实的 Node 后端 (3002端口)
          '^/api/.*': {
            target: 'http://localhost:3002',
            changeOrigin: true
          },
          '/images': {
            target: 'http://localhost:3002',
            changeOrigin: true
          },
          '/models': {
            target: 'http://localhost:3002',
            changeOrigin: true
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
