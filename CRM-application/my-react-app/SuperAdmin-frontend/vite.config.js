import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    // The dashboard can sit inside the CRM app, whose node_modules may contain
    // another React version. Force React Router and the dashboard to share one
    // React/React DOM instance to avoid invalid hook dispatcher errors.
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
