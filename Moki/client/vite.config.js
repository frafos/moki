import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgrPlugin from 'vite-plugin-svgr';
import dsv from '@rollup/plugin-dsv' 

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), svgrPlugin(), dsv()],
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000/",
        changeOrigin: true,
        secure: false,
      },
      "/data": {
        target: "http://127.0.0.1:5000/",
        changeOrigin: true,
        secure: false,
      },
    }
  },
  build: {
    outDir: "build",
  },
});
