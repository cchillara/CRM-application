import dotenv from "dotenv";
import app from "./app.js";
import prisma from "./db/index.js"
import "./firebase-admin.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
   await prisma.$queryRaw`SELECT NOW()`;

    console.log("PostgreSQL connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
