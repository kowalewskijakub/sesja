import { NextResponse } from "next/server";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { questions } from "@/db/schema";
import { getBoardBySlug, submissionWindowOpen } from "@/lib/boards";
import { ingestQuestion } from "@/lib/matching";
import { clientIp, hashIp, isRateLimited } from "@/lib/rate-limit";

const MAX_LEN = 400;
const MAX_BATCH = 50;

/** Ranking pytań tablicy. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const board = await getBoardBySlug(slug);
  if (!board) {
    return NextResponse.json({ error: "Nie znaleziono tablicy" }, { status: 404 });
  }

  const rows = await db
    .select({
      id: questions.id,
      text: questions.text,
      count: questions.count,
    })
    .from(questions)
    .where(and(eq(questions.boardId, board.id), eq(questions.hidden, false)))
    .orderBy(desc(questions.count), asc(questions.createdAt));

  return NextResponse.json({ questions: rows });
}

/** Dodanie jednego lub wielu pytań (każda linia / element = osobne pytanie). */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const board = await getBoardBySlug(slug);
  if (!board) {
    return NextResponse.json({ error: "Nie znaleziono tablicy" }, { status: 404 });
  }

  if (!submissionWindowOpen(board)) {
    return NextResponse.json(
      { error: "Dodawanie pytań do tej tablicy jest teraz zamknięte" },
      { status: 403 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });
  }

  // Akceptujemy { text } albo { texts: [] }. Tekst może mieć wiele linii.
  const raw: string[] = Array.isArray(body.texts)
    ? body.texts.map((t) => String(t))
    : [String(body.text ?? "")];

  const items = raw
    .flatMap((t) => t.split("\n"))
    .map((t) => t.trim())
    .filter((t) => t.length >= 3)
    .map((t) => t.slice(0, MAX_LEN))
    .slice(0, MAX_BATCH);

  if (items.length === 0) {
    return NextResponse.json(
      { error: "Wpisz treść pytania (min. 3 znaki)" },
      { status: 400 },
    );
  }

  const ipHash = hashIp(clientIp(req), slug);
  if (await isRateLimited(board.id, ipHash)) {
    return NextResponse.json(
      { error: "Za dużo pytań w krótkim czasie — odczekaj chwilę" },
      { status: 429 },
    );
  }

  let added = 0;
  for (const text of items) {
    await ingestQuestion(board.id, text, ipHash);
    added++;
  }

  return NextResponse.json({ added });
}
