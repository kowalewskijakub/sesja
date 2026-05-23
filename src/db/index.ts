import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Placeholder pozwala zbudować aplikację bez ustawionego DATABASE_URL.
// Zapytania i tak wykonają się dopiero w runtime, gdy zmienna jest ustawiona.
const connectionString =
  process.env.DATABASE_URL ?? "postgresql://user:pass@localhost/placeholder";

const sql = neon(connectionString);

export const db = drizzle(sql, { schema });
