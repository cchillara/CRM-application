import express from 'express'


const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CRM backend is running",
  });
});



//Routes Declaration Part
import authRouter from "./routes/auth.routes.js";

app.use("/api/v1/auth",authRouter);
export default app;