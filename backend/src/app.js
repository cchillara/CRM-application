
import express from "express";
import cors from "cors";

import authRouter from "./routes/auth.routes.js";
import superAdminRouter from "./routes/superAdmin.routes.js";
import clientAdminRouter from "./routes/clientAdmin.routes.js";
import { errorHandler } from "./middleware/errormiddleware.js";
import { ApiError } from "./utils/apiError.js";

const app = express();

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.use(express.json());

app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "CRM backend is running",
  });
});

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
