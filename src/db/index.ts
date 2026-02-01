import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Only connect if DATABASE_URL is available
const connectionString = process.env.DATABASE_URL || "";

export const db = connectionString 
  ? drizzle(postgres(connectionString), { schema })
  : null;
