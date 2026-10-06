import express from "express";
import cors from "cors";

import authRouter from "./routes/auth.routes.js";
import superAdminRouter from "./routes/superAdmin.routes.js";
import { errorHandler } from "./middleware/errormiddleware.js";
import clientAdminRouter from "./routes/clientAdmin.routes.js";

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


app.use(
  "/api/v1/auth",
  authRouter
);
app.use("/api/v1/super-admin", superAdminRouter);

app.use(errorHandler);


app.use(
  "/api/v1/client-admin",
  clientAdminRouter
);


export default app;
