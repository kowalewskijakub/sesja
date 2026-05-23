import { NextResponse } from "next/server";
import { db } from "@/db";
import { adminCodes } from "@/db/schema";
import { getBoardBySlug } from "@/lib/boards";
import { generateCode } from "@/lib/auth";
import { sendAdminCode } from "@/lib/email";

/** Krok 1 logowania admina — wysyłka kodu OTP na e-mail prowadzącego. */
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

  const email = String(body.email ?? "").trim().toLowerCase();
  if (email !== board.adminEmail) {
    return NextResponse.json(
      { error: "Ten e-mail nie jest przypisany jako prowadzący tej tablicy" },
      { status: 403 },
    );
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await db.insert(adminCodes).values({ boardId: board.id, code, expiresAt });
  await sendAdminCode(email, code, { subject: board.subject, lecturer: board.lecturer });

  return NextResponse.json({ ok: true });
}
