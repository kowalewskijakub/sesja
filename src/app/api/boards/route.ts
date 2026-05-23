import { NextResponse } from "next/server";
import { db } from "@/db";
import { boards } from "@/db/schema";
import { newSlug } from "@/lib/slug";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Zaloguj się, aby stworzyć tablicę" },
      { status: 401 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });
  }

  const subject = String(body.subject ?? "").trim();
  const year = String(body.year ?? "").trim();
  const lecturer = String(body.lecturer ?? "").trim();

  if (!subject || !year || !lecturer) {
    return NextResponse.json(
      { error: "Uzupełnij przedmiot, rok i wykładowcę" },
      { status: 400 },
    );
  }
  if (subject.length > 200 || lecturer.length > 200 || year.length > 60) {
    return NextResponse.json({ error: "Wpisane dane są za długie" }, { status: 400 });
  }

  const slug = newSlug();
  await db.insert(boards).values({
    slug,
    subject,
    year,
    lecturer,
    ownerId: user.id,
  });

  return NextResponse.json({ slug });
}
