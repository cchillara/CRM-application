import "./config/env.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import authRouter from "./routes/auth.routes.js";
import superAdminRouter from "./routes/superAdmin.routes.js";
import clientAdminRouter from "./routes/clientAdmin.routes.js";
import salesRouter from "./routes/sales.routes.js";
import managerRouter from "./routes/manager.routes.js";
import { errorHandler } from "./middleware/errormiddleware.js";
import { ApiError } from "./utils/apiError.js";
import { requestId } from "./middleware/requestId.js";

const app = express();
const corsOptions = {
  origin(origin, callback) {
    const configuredOrigins = (process.env.CLIENT_ORIGINS || process.env.FRONTEND_ORIGINS || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const localOrigins = new Set([
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5174",
    ]);

    if (!origin || configuredOrigins.includes(origin) || localOrigins.has(origin)) {
      return callback(null, true);
    }
    if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new ApiError(403, `CORS: origin '${origin}' is not allowed`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
  exposedHeaders: ["X-Request-ID"],
  maxAge: 600,
};

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet());
app.use(requestId);
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CRM backend is running",
    instanceId: process.env.INSTANCE_ID || `backend-${process.env.PORT || 5000}`,
    port: Number(process.env.PORT) || 5000,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    requestId: req.id,
  });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/super-admin", superAdminRouter);
app.use("/api/v1/client-admin", clientAdminRouter);
app.use("/api/v1/sales", salesRouter);
app.use("/api/v1/manager", managerRouter);

app.use((req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
});
app.use(errorHandler);

export default app;
