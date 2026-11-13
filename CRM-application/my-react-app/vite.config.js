import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/setupTests.js",
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_PROXY_TARGET || 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
  }
})
