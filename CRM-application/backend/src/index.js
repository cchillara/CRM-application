import "./config/env.js";
import dotenv from "dotenv";
import app from "./app.js";
import prisma from "./db/index.js";
import "./firebase-admin.js";

dotenv.config();

const DEFAULT_PORT = process.env.PORT || 5001;
const DEFAULT_INSTANCE_ID = process.env.INSTANCE_ID || `backend-${DEFAULT_PORT}`;

export const startServer = async (options = {}) => {
  const port = options.port || Number(process.env.PORT) || DEFAULT_PORT;
  const instanceId = options.instanceId || process.env.INSTANCE_ID || DEFAULT_INSTANCE_ID;

  process.env.PORT = String(port);
  process.env.INSTANCE_ID = instanceId;

  try {
    await prisma.$queryRaw`SELECT NOW()`;
    console.log(`[${instanceId}] PostgreSQL connected successfully`);

    const server = app.listen(port, () => {
      console.log(`[${instanceId}] Server running on port ${port}`);
    });

    const shutdown = async (signal) => {
      console.log(`\n[${instanceId}] Received ${signal}, starting graceful shutdown...`);
      server.close(async () => {
        console.log(`[${instanceId}] HTTP server closed`);
        try {
          await prisma.$disconnect();
          console.log(`[${instanceId}] Database disconnected`);
        } catch (dbErr) {
          console.error(`[${instanceId}] Error disconnecting database:`, dbErr);
        }
        process.exit(0);
      });

      // Force close if graceful shutdown hangs
      setTimeout(() => {
        console.error(`[${instanceId}] Forceful shutdown timeout exceeded, exiting`);
        process.exit(1);
      }, 10000).unref();
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));

    return server;
  } catch (error) {
    console.error(`[${instanceId}] Failed to start server:`, error);
    process.exit(1);
  }
};

// Start automatically when executed directly
if (process.argv[1] && (process.argv[1].endsWith("src/index.js") || process.argv[1].endsWith("src\\index.js") || process.argv[1].endsWith("index.js"))) {
  startServer();
}

export default startServer;
