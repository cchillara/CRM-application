import http from "http";
import crypto from "crypto";
import { RoundRobinSelector } from "./algorithms/roundRobin.js";
import { HealthChecker } from "./health/healthChecker.js";
import { forwardRequest } from "./proxy/requestForwarder.js";
import { isValidUuid } from "./proxy/headers.js";
import logger from "./logger/logger.js";
import config from "./config.js";

/**
 * Generates CORS headers for direct load balancer responses
 */
export const getCorsHeaders = (req) => {
  const origin = req.headers["origin"] || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Request-ID",
    "Access-Control-Expose-Headers": "X-Request-ID",
    "Access-Control-Max-Age": "600",
  };
};

/**
 * Creates and configures the HTTP Load Balancer server.
 */
export const createLoadBalancer = (customConfig = {}) => {
  const mergedConfig = {
    ...config,
    ...customConfig,
    backends: customConfig.backends || config.backends,
    healthCheck: { ...config.healthCheck, ...customConfig.healthCheck },
    proxy: { ...config.proxy, ...customConfig.proxy },
  };

  const selector = new RoundRobinSelector(mergedConfig.backends);
  const healthChecker = new HealthChecker(selector, mergedConfig.healthCheck);

  const server = http.createServer(async (req, res) => {
    const rawReqId = req.headers["x-request-id"];
    const requestId = isValidUuid(rawReqId) ? rawReqId.trim() : crypto.randomUUID();

    // Internal Load Balancer Management endpoints
    if (req.url === "/lb-status") {
      if (req.method === "OPTIONS") {
        res.writeHead(204, getCorsHeaders(req));
        return res.end();
      }
      if (req.method === "GET") {
        res.writeHead(200, {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
          ...getCorsHeaders(req),
        });
        return res.end(
          JSON.stringify(
            {
              name: "SHNOOR CRM Load Balancer",
              port: mergedConfig.port,
              algorithm: "Round Robin",
              uptime: process.uptime(),
              timestamp: new Date().toISOString(),
              health: healthChecker.getStatus(),
              requestId,
            },
            null,
            2
          )
        );
      }
    }

    if (req.url === "/lb-health") {
      if (req.method === "OPTIONS") {
        res.writeHead(204, getCorsHeaders(req));
        return res.end();
      }
      if (req.method === "GET") {
        const targets = selector.getAllTargets();
        const healthyCount = targets.filter((t) => t.healthy).length;
        const statusCode = healthyCount > 0 ? 200 : 503;

        res.writeHead(statusCode, {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
          ...getCorsHeaders(req),
        });
        return res.end(
          JSON.stringify({
            status: healthyCount > 0 ? "HEALTHY" : "UNHEALTHY",
            healthyInstances: healthyCount,
            totalInstances: targets.length,
            requestId,
          })
        );
      }
    }

    // Select next backend target via Round Robin
    const target = selector.getNextTarget();

    if (!target) {
      logger.warn("Request rejected: all backend instances are down", {
        method: req.method,
        url: req.url,
        requestId,
      });

      // If it's a preflight request when backends are down, answer gracefully
      if (req.method === "OPTIONS") {
        res.writeHead(204, getCorsHeaders(req));
        return res.end();
      }

      res.writeHead(503, {
        "Content-Type": "application/json",
        "X-Request-ID": requestId,
        ...getCorsHeaders(req),
      });
      return res.end(
        JSON.stringify({
          statusCode: 503,
          success: false,
          message: "Service Unavailable: No healthy backend instances available",
          requestId,
        })
      );
    }

    // Proxy the request to the selected backend instance
    try {
      await forwardRequest(req, res, target, {
        timeoutMs: mergedConfig.proxy.timeoutMs,
        lbPort: mergedConfig.port,
        selector, // Pass selector for failover if initial connection fails
      });
    } catch (err) {
      // Errors are handled inside forwardRequest; ensure no unhandled promise rejection
    }
  });

  return {
    server,
    selector,
    healthChecker,
    config: mergedConfig,

    start: (port = mergedConfig.port, host = mergedConfig.host) => {
      return new Promise((resolve, reject) => {
        healthChecker.start();

        server.listen(port, host, () => {
          logger.info(`Load Balancer listening on http://${host}:${port}`, {
            algorithm: "Round Robin",
            backends: mergedConfig.backends.map((b) => `${b.id}->${b.port}`),
          });
          resolve(server);
        });

        server.on("error", (err) => {
          logger.error("Load Balancer server error", err);
          reject(err);
        });
      });
    },

    stop: () => {
      return new Promise((resolve) => {
        healthChecker.stop();
        server.close(() => {
          logger.info("Load Balancer server stopped");
          resolve();
        });
      });
    },
  };
};

export default createLoadBalancer;
