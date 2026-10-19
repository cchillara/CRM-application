
import express from "express";
import cors from "cors";
import helmet from "helmet";

import authRouter from "./routes/auth.routes.js";
import superAdminRouter from "./routes/superAdmin.routes.js";
import clientAdminRouter from "./routes/clientAdmin.routes.js";
import { errorHandler } from "./middleware/errormiddleware.js";
import { ApiError } from "./utils/apiError.js";
import { requestId } from "./middleware/requestId.js";
import { httpLogger } from "./middleware/httpLogger.js";

const corsOptions = {
    origin: (origin, callback) => {
        // Parse lazily so the value is read AFTER dotenv has loaded.
        // This makes the CORS config work correctly in test environments
        // where process.env is populated after module initialisation.
        const allowedOrigins = (process.env.CLIENT_ORIGINS ?? "")
            .split(",")
            .map((o) => o.trim())
            .filter(Boolean);

        // Allow server-to-server requests that carry no Origin header
        // (e.g. curl, Postman, backend tests).
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(
            new ApiError(403, `CORS: origin '${origin}' is not allowed`)
        );
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
    exposedHeaders: ["X-Request-ID"],
    maxAge: 600, // cache preflight for 10 minutes
};

const app = express();

/* ──────────────────────────────────────────────────────────────
 * Security headers
 * ──────────────────────────────────────────────────────────────*/
app.disable("x-powered-by"); // belt-and-suspenders; helmet also does this
app.use(helmet());

/* ──────────────────────────────────────────────────────────────
 * Correlation ID  →  HTTP logging  →  CORS  →  body parsing
 *
 * requestId must come first so httpLogger and error responses
 * can all include the same ID.
 * ──────────────────────────────────────────────────────────────*/
app.use(requestId);
app.use(httpLogger);
app.use(cors(corsOptions));
app.use(express.json());

/* ──────────────────────────────────────────────────────────────
 * Health check (no auth required)
 * ──────────────────────────────────────────────────────────────*/
app.get("/health", (req, res) => {
    return res.status(200).json({
        success: true,
        message: "CRM backend is running",
        requestId: req.id,
    });
});

/* ──────────────────────────────────────────────────────────────
 * API routes
 * ──────────────────────────────────────────────────────────────*/
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/super-admin", superAdminRouter);
app.use("/api/v1/client-admin", clientAdminRouter);

// Handle unknown routes without changing existing routes.
app.use((req, res, next) => {
    next(
        new ApiError(
            404,
            `Route not found: ${req.method} ${req.originalUrl}`
        )
    );
});

// Keep error middleware last.
app.use(errorHandler);

export default app;
