import "./config/env.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRouter from "./routes/auth.routes.js";
import superAdminRouter from "./routes/superAdmin.routes.js";
import { errorHandler } from "./middleware/errormiddleware.js";
import clientAdminRouter from "./routes/clientAdmin.routes.js";
import salesRouter from "./routes/sales.routes.js";
import managerRouter from "./routes/manager.routes.js";

const app = express();
const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  ...(process.env.FRONTEND_ORIGINS || "").split(",").map((origin) => origin.trim()).filter(Boolean),
]);

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      // In development allow any localhost
      if (/^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
  }),
);

app.use(cookieParser());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CRM backend is running",
  });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/super-admin", superAdminRouter);
app.use("/api/v1/client-admin", clientAdminRouter);
app.use("/api/v1/sales", salesRouter);
app.use("/api/v1/manager", managerRouter);

app.use(errorHandler);

export default app;
