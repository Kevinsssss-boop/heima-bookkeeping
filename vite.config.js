import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',  // 使用相对路径，Electron 打包后能正确加载资源
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5173,
  },
});
