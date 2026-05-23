// Włącza rozszerzenie pgvector w bazie Neon.
// Uruchom JEDEN raz przed `npm run db:push`:
//   npm run db:init
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Brak DATABASE_URL. Skopiuj .env.example do .env i uzupełnij.");
  process.exit(1);
}

const sql = neon(url);

try {
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;
  console.log("OK — rozszerzenie pgvector jest włączone.");
  console.log("Teraz uruchom: npm run db:push");
} catch (err) {
  console.error("Nie udało się włączyć pgvector:", err.message);
  process.exit(1);
}
