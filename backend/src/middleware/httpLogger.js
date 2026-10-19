
import morgan from "morgan";



// Custom token: request correlation ID attached by requestId middleware.
morgan.token("id", (req) => req.id ?? "-");

// Custom token: authenticated user id (never email or token).
morgan.token("uid", (req) => req.user?.id ?? req.user?.uid ?? "-");

// Build a compact JSON-style format string.
const LOG_FORMAT = [
    ":id",
    ":method",
    ":url",
    ":status",
    ":res[content-length]",
    ":response-time ms",
    ":remote-addr",
    "uid=:uid",
].join(" | ");

// Suppress output during automated tests.
const skip = () => process.env.NODE_ENV === "test";

export const httpLogger = morgan(LOG_FORMAT, { skip });
