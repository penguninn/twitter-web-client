import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";
import {VitePWA} from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'public',
        filename: 'firebase-messaging-sw.js',
        registerType: 'autoUpdate',
        injectManifest: {
          injectionPoint: undefined
        }
      })
  ],
  define: {
    global: 'globalThis',
  },
  server: {
    port: 3000
  }
})
