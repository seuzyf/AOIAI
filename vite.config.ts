import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3001,
        host: '0.0.0.0',
        proxy: {
          // 使用正则精准匹配，仅代理 /api/ 开头的请求，避免误拦截 /api.ts 文件
          '^/api/.*': {
            target: 'http://localhost:3001',
            changeOrigin: true
          },
          '/images': {
            target: 'http://localhost:3001',
            changeOrigin: true
          },
          '/models': {
            target: 'http://localhost:3001',
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