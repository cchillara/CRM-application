import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // This portal lives inside the CRM app, so make React and React DOM resolve
    // to one shared instance throughout the dependency graph.
    dedupe: ["react", "react-dom"]
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"]
  },
  server: { host: "0.0.0.0", port: 5175, strictPort: true }
});
