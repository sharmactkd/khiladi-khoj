import compression from "compression";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import pinoHttp from "pino-http";

import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";
import { notFoundMiddleware } from "./middlewares/notFoundMiddleware.js";
import healthRouter from "./routes/healthRoutes.js";

const app = express();

app.disable("x-powered-by");

if (env.TRUST_PROXY) {
  app.set("trust proxy", 1);
}

app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(compression());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.CLIENT_URLS.includes(origin)) {
        callback(null, true);
        return;
      }

      const error = new Error("Origin is not allowed by CORS");
      error.statusCode = 403;
      callback(error);
    },
    credentials: false,
    methods: ["GET", "OPTIONS"],
    allowedHeaders: ["Accept", "Content-Type"],
    maxAge: 86400,
  }),
);

app.use(express.json({ limit: "32kb" }));
app.use(express.urlencoded({ extended: false, limit: "32kb" }));

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests. Please try again later.",
    },
  }),
);

app.use("/api/health", healthRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
