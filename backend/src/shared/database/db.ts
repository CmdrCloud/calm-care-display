import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/carecircle";

const pool = new pg.Pool({
  connectionString,
});

export const db = drizzle(pool, { schema });
export type DbClient = typeof db;
export { pool };
