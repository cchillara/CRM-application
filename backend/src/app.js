import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.routes.js";
import superAdminRouter from "./routes/superAdmin.routes.js";
import { errorHandler } from "./middleware/errormiddleware.js";

const app = express();

app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CRM backend is running",
  });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/super-admin", superAdminRouter);

app.use(errorHandler);

export default app;
