import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { adminCodes } from "@/db/schema";
import { getBoardBySlug } from "@/lib/boards";
import { adminCookieName, signAdminToken } from "@/lib/auth";

/** Krok 2 logowania admina — weryfikacja kodu OTP i ustawienie sesji. */
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
    return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });
  }

  const code = String(body.code ?? "").trim();
  const match = await db
    .select({ id: adminCodes.id })
    .from(adminCodes)
    .where(
      and(
        eq(adminCodes.boardId, board.id),
        eq(adminCodes.code, code),
        gt(adminCodes.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (match.length === 0) {
    return NextResponse.json(
      { error: "Nieprawidłowy lub wygasły kod" },
      { status: 401 },
    );
  }

  // Kody jednorazowe — kasujemy wszystkie kody tej tablicy po użyciu.
  await db.delete(adminCodes).where(eq(adminCodes.boardId, board.id));

  const token = await signAdminToken(board.id);
  const store = await cookies();
  store.set(adminCookieName(slug), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });

  return NextResponse.json({ ok: true });
}
