import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import type { UserConfig } from 'vite'
import type { InlineConfig } from 'vitest/node'

interface VitestConfigExport extends UserConfig {
  test: InlineConfig
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  worker: {
    format: "es",
  },
  assetsInclude: ["**/*.wasm"],
  server: {
    watch: {
      ignored: ['**/public/icons/**']
    },
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
    proxy: {
      '/enka-api': {
        target: 'https://enka.network',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/enka-api/, '')
      },
      '/yatta-api': {
        target: 'https://gi.yatta.moe',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/yatta-api/, '')
      }
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(import.meta.dirname, "index.html"),
      },
    },
  },
  test: {
    exclude: ['node_modules/**', 'emscripten/**'],
  }
} as VitestConfigExport)