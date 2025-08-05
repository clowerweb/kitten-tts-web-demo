import { defineConfig } from 'vite'
import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { resolve } from 'path'

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/kitten-tts-web-demo/' : '/',
  server: {
    fs: {
      allow: ['..']
    },
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    }
  },
  optimizeDeps: {
    exclude: ['@xenova/transformers']
  },
  build: {
    rollupOptions: {
      plugins: [
        {
          name: 'copy-model-files',
          generateBundle() {
            // Copy model directory to dist
            const distModelDir = resolve('dist/model')
            if (!existsSync(distModelDir)) {
              mkdirSync(distModelDir, { recursive: true })
            }
            copyFileSync(resolve('model/kitten_tts_nano_v0_1.onnx'), resolve('dist/model/kitten_tts_nano_v0_1.onnx'))
            copyFileSync(resolve('model/voices.json'), resolve('dist/model/voices.json'))
          }
        }
      ]
    }
  }
})