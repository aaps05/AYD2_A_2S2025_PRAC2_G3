import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api/servicios': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api/especialidades': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
    },
  },
});
