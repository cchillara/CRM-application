try {
  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile();
  }
} catch {
  // .env file is optional
}

const parseBackends = () => {
  if (process.env.BACKEND_URLS) {
    return process.env.BACKEND_URLS.split(",")
      .map((entry, index) => {
        const trimmed = entry.trim();
        if (!trimmed) return null;
        try {
          const parsed = new URL(trimmed);
          return {
            id: `backend-${index + 1}`,
            host: parsed.hostname || "127.0.0.1",
            port: parseInt(parsed.port, 10) || (parsed.protocol === "https:" ? 443 : 80),
            protocol: parsed.protocol || "http:",
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  }

  return [
    { id: "backend-1", host: "127.0.0.1", port: 5001, protocol: "http:" },
    { id: "backend-2", host: "127.0.0.1", port: 5002, protocol: "http:" },
    { id: "backend-3", host: "127.0.0.1", port: 5003, protocol: "http:" },
  ];
};

export const config = {
  port: parseInt(process.env.LB_PORT || process.env.PORT || "5000", 10),
  host: process.env.LB_HOST || "0.0.0.0",

  backends: parseBackends(),

  healthCheck: {
    path: process.env.HEALTH_CHECK_PATH || "/health",
    intervalMs: parseInt(process.env.HEALTH_CHECK_INTERVAL_MS || "5000", 10),
    timeoutMs: parseInt(process.env.HEALTH_CHECK_TIMEOUT_MS || "2000", 10),
    unhealthyThreshold: parseInt(process.env.HEALTH_CHECK_UNHEALTHY_THRESHOLD || "2", 10),
    healthyThreshold: parseInt(process.env.HEALTH_CHECK_HEALTHY_THRESHOLD || "1", 10),
  },

  proxy: {
    timeoutMs: parseInt(process.env.PROXY_TIMEOUT_MS || "30000", 10),
    connectionTimeoutMs: parseInt(process.env.PROXY_CONNECT_TIMEOUT_MS || "5000", 10),
    maxRetries: 1, // Only for initial connection failures on idempotent requests
  },
};

export default config;
