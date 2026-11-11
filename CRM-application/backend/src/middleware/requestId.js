
import crypto from "node:crypto";

/**
 * requestId middleware
 *
 * Attaches a unique correlation ID to every request so that all
 * log lines and error responses for a single HTTP transaction can
 * be correlated later.
 *
 * Behaviour:
 * - Reads the incoming `X-Request-ID` header when present (allows
 *   upstream proxies / load-balancers to pass their own IDs through).
 * - Falls back to a fresh `crypto.randomUUID()` when the header is
 *   absent or blank.
 * - Stores the final value on `req.id`.
 * - Echoes the value back to the caller in `X-Request-ID` so clients
 *   can include it in support requests.
 */
export const requestId = (req, res, next) => {
    const incoming = req.headers["x-request-id"];

    // Only accept well-formed UUID v4 from upstream to avoid log-injection.
    const UUID_RE =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    const id =
        typeof incoming === "string" && UUID_RE.test(incoming.trim())
            ? incoming.trim()
            : crypto.randomUUID();

    req.id = id;
    res.setHeader("X-Request-ID", id);

    return next();
};
