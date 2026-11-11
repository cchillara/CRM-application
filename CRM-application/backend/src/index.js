import "./config/env.js";
import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";
import app from "./app.js";
import prisma from "./db/index.js";
import "./firebase-admin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const DEFAULT_PORT = Number(process.env.PORT) || 5000;
const DEFAULT_INSTANCE_ID = process.env.INSTANCE_ID || `backend-${DEFAULT_PORT}`;

export const startServer = async (options = {}) => {
  const port = Number(options.port) || Number(process.env.PORT) || DEFAULT_PORT;
  const instanceId = options.instanceId || process.env.INSTANCE_ID || DEFAULT_INSTANCE_ID;

  process.env.PORT = String(port);
  process.env.INSTANCE_ID = instanceId;

  try {
    await prisma.$queryRaw`SELECT NOW()`;
    console.log(`[${instanceId}] PostgreSQL connected successfully`);
    const server = app.listen(port, () => {
      console.log(`[${instanceId}] Server running on port ${port}`);
    });

    const shutdown = (signal) => {
      server.close(async () => {
        try {
          await prisma.$disconnect();
        } catch (error) {
          console.error(`[${instanceId}] Error disconnecting database:`, error);
        }
        process.exit(0);
      });

      setTimeout(() => process.exit(1), 10000).unref();
    };

    process.once("SIGINT", () => shutdown("SIGINT"));
    process.once("SIGTERM", () => shutdown("SIGTERM"));
    return server;
  } catch (error) {
    console.error(`[${instanceId}] Failed to start server:`, error);
    process.exitCode = 1;
    return null;
  }
};

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  startServer();
}

export default startServer;
