import mongoose from "mongoose";

import { env } from "./env.js";
import { logger } from "./logger.js";

export const connectDatabase = async () => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGODB_URI, {
    autoIndex: !env.IS_PRODUCTION,
    serverSelectionTimeoutMS: 10_000,
  });
  logger.info({ database: mongoose.connection.name }, "MongoDB connected");
};

export const disconnectDatabase = async () => {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
};
