import { NextResponse } from "next/server";
import { getBoardBySlug } from "@/lib/boards";
import { findSimilar } from "@/lib/matching";

/** Podpowiedzi na żywo — podobne pytania już istniejące w tablicy. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const board = await getBoardBySlug(slug);
  if (!board) {
    return NextResponse.json({ error: "Nie znaleziono tablicy" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ suggestions: [] });
  }

  const text = String(body.text ?? "").trim().slice(0, 400);
  const suggestions = await findSimilar(board.id, text, 3);

  return NextResponse.json({
    suggestions: suggestions.map((s) => ({
      id: s.id,
      text: s.text,
      count: s.count,
    })),
  });
}
