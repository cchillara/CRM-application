import express from "express";
import cors from "cors";

import authRouter from "./routes/auth.routes.js";
import clientAdminRouter from "./routes/clientAdmin.routes.js";

const app = express();


/*
|--------------------------------------------------------------------------
| Middleware
|--------------------------------------------------------------------------
*/

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.use(express.json());


/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get("/health", (req, res) => {

  res.status(200).json({
    success: true,
    message: "CRM backend is running",
  });

});


/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
*/

app.use(
  "/api/v1/auth",
  authRouter
);


/*
|--------------------------------------------------------------------------
| Client Admin Routes
|--------------------------------------------------------------------------
*/

app.use(
  "/api/v1/client-admin",
  clientAdminRouter
);


export default app;
