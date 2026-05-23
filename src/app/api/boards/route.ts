import { NextResponse } from "next/server";
import { db } from "@/db";
import { boards } from "@/db/schema";
import { newSlug } from "@/lib/slug";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });
  }

  const subject = String(body.subject ?? "").trim();
  const year = String(body.year ?? "").trim();
  const lecturer = String(body.lecturer ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();

  if (!subject || !year || !lecturer) {
    return NextResponse.json(
      { error: "Uzupełnij przedmiot, rok i wykładowcę" },
      { status: 400 },
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Podaj poprawny e-mail" }, { status: 400 });
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
    adminEmail: email,
  });

  return NextResponse.json({ slug });
}
