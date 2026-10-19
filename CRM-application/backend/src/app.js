import "dotenv/config";
import express from "express";
import cors from "cors";

import authRouter from "./routes/auth.routes.js";
import superAdminRouter from "./routes/superAdmin.routes.js";
import { errorHandler } from "./middleware/errormiddleware.js";
import clientAdminRouter from "./routes/clientAdmin.routes.js";

const app = express();
const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  ...(process.env.FRONTEND_ORIGINS || "").split(",").map((origin) => origin.trim()).filter(Boolean),
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
  }),
);

app.use(express.json());

app.get("/health", (req, res) => {

  res.status(200).json({
    success: true,
    message: "CRM backend is running",
  });

});


app.use(
  "/api/v1/auth",
  authRouter
);
app.use("/api/v1/super-admin", superAdminRouter);
app.use(
  "/api/v1/client-admin",
  clientAdminRouter
);

app.use(errorHandler);

export default app;
