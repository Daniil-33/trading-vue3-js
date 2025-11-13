import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  
  define: {
    // Replace webpack's DefinePlugin
    MOB_DEBUG: JSON.stringify(process.env.MOB_DEBUG || false),
  },
  
  server: {
    host: '0.0.0.0',
    port: 8080,
    open: true,
  },
  
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.js', import.meta.url)),
      name: 'TradingVue',
      fileName: (format) => `trading-vue.${format}.js`,
    },
    rollupOptions: {
      // Make sure to externalize deps that shouldn't be bundled
      external: ['vue'],
      output: {
        // Provide global variables to use in the UMD build
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
  
  optimizeDeps: {
    exclude: ['vue'],
  },
  
  worker: {
    format: 'es',
  },
})
