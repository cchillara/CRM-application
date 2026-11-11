const formatTimestamp = () => new Date().toISOString();

export const logger = {
  info: (message, meta = {}) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    console.log(`[${formatTimestamp()}] [INFO] [LB] ${message}${metaStr}`);
  },

  warn: (message, meta = {}) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    console.warn(`[${formatTimestamp()}] [WARN] [LB] ${message}${metaStr}`);
  },

  error: (message, error = null, meta = {}) => {
    const errDetails = error?.stack || error?.message || error || "";
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    console.error(`[${formatTimestamp()}] [ERROR] [LB] ${message}${metaStr} ${errDetails}`);
  },

  request: ({ method, url, targetId, targetPort, statusCode, durationMs, requestId }) => {
    console.log(
      `[${formatTimestamp()}] [REQUEST] [${targetId}:${targetPort}] ${method} ${url} -> ${statusCode} (${durationMs}ms) [reqId: ${requestId}]`
    );
  },
};

export default logger;

