import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgrPlugin from 'vite-plugin-svgr';
import dsv from '@rollup/plugin-dsv';
import path from "path";

// Without it dynamic require is not possible in config file
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), svgrPlugin(), dsv()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@charts": path.resolve(__dirname, "./src/js/charts")
    }
  },
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
    // fix React minify issue: https://github.com/vitejs/vite/issues/2139
    commonjsOptions: {
      transformMixedEsModules: true,
      defaultIsModuleExports(id) {
        try {
          const module = require(id);
          if (module?.default) {
            return false;
          }
          return "auto"
        } catch (error) {
          return 'auto';
        }
      },
    }
  },
});
