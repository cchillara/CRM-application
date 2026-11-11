import http from "http";
import { buildUpstreamHeaders, filterDownstreamHeaders } from "./headers.js";
import logger from "../logger/logger.js";

const IDEMPOTENT_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Forwards an incoming HTTP client request to a selected backend target.
 */
export const forwardRequest = (req, res, target, options = {}) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const timeoutMs = options.timeoutMs || 30000;
    const lbPort = options.lbPort || 5000;
    const selector = options.selector || null;
    const retryCount = options.retryCount || 0;

    const { headers: upstreamHeaders, requestId } = buildUpstreamHeaders(
      req,
      target,
      lbPort
    );

    // Always echo the requestId on the client response
    res.setHeader("X-Request-ID", requestId);

    let clientAborted = false;
    let proxyResStarted = false;

    const proxyReq = http.request(
      {
        hostname: target.host,
        port: target.port,
        path: req.url, // Path and query parameters preserved verbatim
        method: req.method,
        headers: upstreamHeaders,
        timeout: timeoutMs,
      },
      (proxyRes) => {
        proxyResStarted = true;

        // Filter hop-by-hop headers and forward remaining
        const downstreamHeaders = filterDownstreamHeaders(proxyRes.headers);

        // Retain status code and status message
        res.writeHead(proxyRes.statusCode, proxyRes.statusMessage, downstreamHeaders);

        // Stream response body back to the client
        proxyRes.pipe(res);

        proxyRes.on("end", () => {
          const durationMs = Date.now() - startTime;
          logger.request({
            method: req.method,
            url: req.url,
            targetId: target.id,
            targetPort: target.port,
            statusCode: proxyRes.statusCode,
            durationMs,
            requestId,
          });

          resolve({
            target,
            statusCode: proxyRes.statusCode,
            durationMs,
            requestId,
          });
        });

        proxyRes.on("error", (err) => {
          logger.error(`Upstream response stream error from ${target.id}`, err, {
            requestId,
          });
          if (!res.writableEnded) {
            res.destroy(err);
          }
          reject(err);
        });
      }
    );

    // Handle client disconnection (client aborted before response finished)
    res.on("close", () => {
      if (!res.writableFinished && !res.writableEnded) {
        clientAborted = true;
        proxyReq.destroy(new Error("Client disconnected"));
      }
    });

    req.on("aborted", () => {
      clientAborted = true;
      proxyReq.destroy(new Error("Client disconnected"));
    });

    // Handle upstream timeout
    proxyReq.on("timeout", () => {
      proxyReq.destroy(new Error(`Upstream request timed out after ${timeoutMs}ms`));
    });

    // Handle upstream errors
    proxyReq.on("error", async (err) => {
      const durationMs = Date.now() - startTime;

      if (clientAborted) {
        logger.info(`Client aborted request before response from ${target.id}`, {
          requestId,
          method: req.method,
          url: req.url,
        });
        return resolve({ target, statusCode: 499, durationMs, requestId });
      }

      logger.error(`Proxy forwarding error to [${target.id}:${target.port}]`, err, {
        requestId,
        method: req.method,
        url: req.url,
      });

      // Mark target failure for health tracking
      target.healthy = false;
      target.consecutiveFailures = (target.consecutiveFailures || 0) + 1;
      target.lastError = err.message;

      // Failover for idempotent requests if connection failed immediately
      const isConnectError = err.code === "ECONNREFUSED" || err.code === "ECONNRESET";
      if (
        isConnectError &&
        IDEMPOTENT_METHODS.has(req.method) &&
        selector &&
        retryCount < 2 &&
        !res.headersSent
      ) {
        const nextTarget = selector.getNextTarget();
        if (nextTarget && nextTarget.id !== target.id) {
          logger.info(`Failing over ${req.method} ${req.url} to [${nextTarget.id}:${nextTarget.port}]`, {
            requestId,
          });
          try {
            const retryResult = await forwardRequest(req, res, nextTarget, {
              ...options,
              retryCount: retryCount + 1,
            });
            return resolve(retryResult);
          } catch {
            // If failover fails, fall through to error response below
          }
        }
      }

      if (!res.headersSent) {
        const isTimeout = err.message.includes("timed out");
        const statusCode = isTimeout ? 504 : 502;
        const message = isTimeout
          ? `Gateway Timeout: Backend instance ${target.id} failed to respond in ${timeoutMs}ms`
          : `Bad Gateway: Unable to connect to backend instance ${target.id}`;

        const origin = req.headers["origin"] || "*";
        res.writeHead(statusCode, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Request-ID",
        });
        res.end(
          JSON.stringify({
            statusCode,
            success: false,
            message,
            targetInstance: target.id,
            requestId,
          })
        );
      }

      reject(err);
    });

    // Pipe client request body to upstream request
    req.pipe(proxyReq);
  });
};

export default forwardRequest;
