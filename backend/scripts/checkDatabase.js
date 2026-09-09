import mongoose from "mongoose";

import { connectDatabase, disconnectDatabase } from "../src/config/database.js";
import { assertIdentityRuntimeConfiguration } from "../src/config/env.js";

try {
  assertIdentityRuntimeConfiguration();
  await connectDatabase();
  await mongoose.connection.db.admin().command({ ping: 1 });
  console.log(`Identity database connection passed (${mongoose.connection.name}).`);
} catch (error) {
  console.error("Identity database connection failed:", error.message);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
