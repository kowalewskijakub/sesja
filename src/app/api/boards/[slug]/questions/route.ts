import { NextResponse } from "next/server";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { questions } from "@/db/schema";
import { getBoardBySlug, submissionWindowOpen } from "@/lib/boards";
import { ingestQuestion } from "@/lib/matching";
import { clientIp, hashIp, isRateLimited } from "@/lib/rate-limit";

const MAX_LEN = 400;

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

/** Dodanie jednego pytania. Dopasowanie do istniejących liczy się automatycznie. */
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

  // Całe pytanie traktujemy jako jeden wpis — ewentualne łamania linii sklejamy.
  const text = String(body.text ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_LEN);

  if (text.length < 3) {
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

  await ingestQuestion(board.id, text, ipHash);

  return NextResponse.json({ added: 1 });
}
