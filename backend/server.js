import http from "node:http";

import app from "./src/app.js";
import { env } from "./src/config/env.js";
import { logger } from "./src/config/logger.js";

const server = http.createServer(app);

server.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      environment: env.NODE_ENV,
    },
    "KHILADI Khoj API started",
  );
});

function shutdown(signal) {
  logger.info({ signal }, "Graceful shutdown started");

  server.close((error) => {
    if (error) {
      logger.error({ error }, "Server shutdown failed");
      process.exitCode = 1;
    }

    process.exit();
  });

  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("uncaughtException", (error) => {
  logger.fatal({ error }, "Uncaught exception");
  process.exit(1);
});

process.on("unhandledRejection", (error) => {
  logger.fatal({ error }, "Unhandled promise rejection");
  process.exit(1);
});
