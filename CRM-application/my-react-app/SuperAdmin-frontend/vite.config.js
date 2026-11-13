import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    resolve: {
      dedupe: ["react", "react-dom"]
    },

    server: {
      port: 5174,
      strictPort: true,
      proxy: {
        "/api": {
          target: env.VITE_BACKEND_PROXY_TARGET || "http://localhost:5000",
          changeOrigin: true
        }
      }
    }
  };
});
