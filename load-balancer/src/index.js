import { createLoadBalancer } from "./server.js";
import logger from "./logger/logger.js";

const lb = createLoadBalancer();

const start = async () => {
  try {
    await lb.start();

    const shutdown = async (signal) => {
      logger.info(`Received ${signal}, shutting down load balancer...`);
      await lb.stop();
      process.exit(0);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    logger.error("Failed to start Load Balancer", error);
    process.exit(1);
  }
};

start();

