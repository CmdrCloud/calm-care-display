import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./db";
import * as path from "path";

async function main() {
  console.log("Running migrations...");
  try {
    await migrate(db, {
      migrationsFolder: path.resolve(process.cwd(), "src/infrastructure/migrations"),
    });
    console.log("Migrations applied successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
