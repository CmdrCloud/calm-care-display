import * as dotenv from "dotenv";
import { buildApp } from "./app";

dotenv.config();

const port = parseInt(process.env.PORT || "3011", 10);
const host = process.env.HOST || "0.0.0.0";

const app = buildApp();

async function start() {
  try {
    await app.listen({ port, host });
    app.log.info(`CareCircle AI Monolith Backend running at http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Handle termination signals
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception thrown:", error);
  process.exit(1);
});

start();
