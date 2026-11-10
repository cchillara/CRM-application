import crypto from "crypto";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

/**
 * Validates whether a string is a standard UUID.
 */
export const isValidUuid = (value) => {
  if (typeof value !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim()
  );
};

/**
 * Builds safe upstream headers for proxy forwarding.
 */
export const buildUpstreamHeaders = (req, target, lbPort = 5000) => {
  const headers = {};

  // Copy allowed client headers (converting to lower-case keys)
  for (const [key, val] of Object.entries(req.headers)) {
    const lowerKey = key.toLowerCase();
    if (!HOP_BY_HOP_HEADERS.has(lowerKey)) {
      headers[lowerKey] = val;
    }
  }

  // Sanitize and append X-Forwarded-For
  const clientIp = req.socket?.remoteAddress || req.connection?.remoteAddress || "127.0.0.1";
  const existingXff = req.headers["x-forwarded-for"];
  headers["x-forwarded-for"] = existingXff ? `${existingXff}, ${clientIp}` : clientIp;

  // Set X-Forwarded-Host and X-Forwarded-Port
  headers["x-forwarded-host"] = req.headers["host"] || `127.0.0.1:${lbPort}`;
  headers["x-forwarded-port"] = String(lbPort);
  headers["x-forwarded-proto"] = req.headers["x-forwarded-proto"] || "http";

  // Ensure request ID propagation
  const incomingReqId = req.headers["x-request-id"];
  const requestId = isValidUuid(incomingReqId) ? incomingReqId.trim() : crypto.randomUUID();
  headers["x-request-id"] = requestId;

  // Point Host to target instance
  headers["host"] = `${target.host}:${target.port}`;

  return { headers, requestId };
};

/**
 * Filters out hop-by-hop headers from upstream response before sending to client.
 */
export const filterDownstreamHeaders = (upstreamHeaders) => {
  const headers = {};
  for (const [key, val] of Object.entries(upstreamHeaders)) {
    const lowerKey = key.toLowerCase();
    if (!HOP_BY_HOP_HEADERS.has(lowerKey)) {
      headers[lowerKey] = val;
    }
  }
  return headers;
};

