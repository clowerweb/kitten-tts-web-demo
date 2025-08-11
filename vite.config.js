import path from "path";

import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/kitten-tts-web-demo/' : '/',
  plugins: [
    tailwindcss(), 
    vue(),
    {
      name: 'onnx-wasm-plugin',
      configureServer(server) {
        server.middlewares.use('/onnx-runtime', (req, res, next) => {
          // Strip ?import parameter from ONNX requests
          if (req.url.includes('?import')) {
            req.url = req.url.replace('?import', '');
          }
          if (req.url.endsWith('.mjs')) {
            res.setHeader('Content-Type', 'application/javascript');
            res.setHeader('Access-Control-Allow-Origin', '*');
          }
          next();
        });
      }
    }
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  worker: { format: "es" },
  build: {
    target: "esnext",
  },
  assetsInclude: ['**/*.wasm'],
  logLevel: process.env.NODE_ENV === "development" ? "error" : "info",
});