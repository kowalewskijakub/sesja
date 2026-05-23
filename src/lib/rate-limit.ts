import { createHash } from "crypto";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { submissions } from "@/db/schema";

/** Hash IP (nie przechowujemy surowego adresu). */
export function hashIp(ip: string, slug: string): string {
  return createHash("sha256").update(`${ip}::${slug}`).digest("hex").slice(0, 32);
}

/** Wyciąga IP klienta z nagłówków requestu (Vercel ustawia x-forwarded-for). */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "0.0.0.0";
}

const WINDOW_SECONDS = 60;
const MAX_PER_WINDOW = 12;

/** Zwraca true, jeśli dane IP przekroczyło limit dodawania pytań. */
export async function isRateLimited(
  boardId: number,
  ipHash: string,
): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_SECONDS * 1000);
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(submissions)
    .where(
      and(
        eq(submissions.boardId, boardId),
        eq(submissions.ipHash, ipHash),
        gte(submissions.createdAt, since),
      ),
    );
  return (rows[0]?.n ?? 0) >= MAX_PER_WINDOW;
}
