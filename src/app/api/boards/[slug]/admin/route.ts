import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { boards, questions } from "@/db/schema";
import { getBoardBySlug } from "@/lib/boards";
import { adminCookieName, isAdmin } from "@/lib/auth";
import { ingestQuestion, mergeQuestions } from "@/lib/matching";
import { tidyText } from "@/lib/normalize";
import { hashIp } from "@/lib/rate-limit";

function parseDate(value: unknown, endOfDay: boolean): Date | null {
  if (!value) return null;
  let s = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) s += endOfDay ? "T23:59:59" : "T00:00:00";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Dane panelu admina — status sesji + pełna lista pytań (z ukrytymi). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const board = await getBoardBySlug(slug);
  if (!board) {
    return NextResponse.json({ error: "Nie znaleziono tablicy" }, { status: 404 });
  }

  if (!(await isAdmin(slug, board.id))) {
    return NextResponse.json({ isAdmin: false });
  }

  const rows = await db
    .select({
      id: questions.id,
      text: questions.text,
      count: questions.count,
      hidden: questions.hidden,
    })
    .from(questions)
    .where(eq(questions.boardId, board.id))
    .orderBy(desc(questions.count), asc(questions.createdAt));

  return NextResponse.json({
    isAdmin: true,
    submissionFrom: board.submissionFrom,
    submissionTo: board.submissionTo,
    questions: rows,
  });
}

/** Akcje admina: okno czasowe, moderacja, scalanie, dodawanie hurtowe. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const board = await getBoardBySlug(slug);
  if (!board) {
    return NextResponse.json({ error: "Nie znaleziono tablicy" }, { status: 404 });
  }
  if (!(await isAdmin(slug, board.id))) {
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });
  }

  const action = String(body.action ?? "");
  const ensureOwn = async (id: number) => {
    const r = await db
      .select({ id: questions.id })
      .from(questions)
      .where(and(eq(questions.id, id), eq(questions.boardId, board.id)));
    return r.length > 0;
  };

  switch (action) {
    case "window": {
      const from = parseDate(body.from, false);
      const to = parseDate(body.to, true);
      if (from && to && from.getTime() > to.getTime()) {
        return NextResponse.json(
          { error: "Data początkowa jest późniejsza niż końcowa" },
          { status: 400 },
        );
      }
      await db
        .update(boards)
        .set({ submissionFrom: from, submissionTo: to })
        .where(eq(boards.id, board.id));
      return NextResponse.json({ ok: true });
    }

    case "hide":
    case "unhide": {
      const id = Number(body.questionId);
      if (!(await ensureOwn(id))) {
        return NextResponse.json({ error: "Nie znaleziono pytania" }, { status: 404 });
      }
      await db
        .update(questions)
        .set({ hidden: action === "hide" })
        .where(eq(questions.id, id));
      return NextResponse.json({ ok: true });
    }

    case "delete": {
      const id = Number(body.questionId);
      if (!(await ensureOwn(id))) {
        return NextResponse.json({ error: "Nie znaleziono pytania" }, { status: 404 });
      }
      await db.delete(questions).where(eq(questions.id, id));
      return NextResponse.json({ ok: true });
    }

    case "edit": {
      const id = Number(body.questionId);
      const text = tidyText(String(body.text ?? ""));
      if (text.length < 3) {
        return NextResponse.json({ error: "Treść jest za krótka" }, { status: 400 });
      }
      if (!(await ensureOwn(id))) {
        return NextResponse.json({ error: "Nie znaleziono pytania" }, { status: 404 });
      }
      await db.update(questions).set({ text }).where(eq(questions.id, id));
      return NextResponse.json({ ok: true });
    }

    case "merge": {
      const targetId = Number(body.targetId);
      const sourceIds = Array.isArray(body.sourceIds)
        ? body.sourceIds.map((x) => Number(x))
        : [];
      if (!targetId || sourceIds.length === 0) {
        return NextResponse.json(
          { error: "Wskaż pytanie docelowe i źródłowe" },
          { status: 400 },
        );
      }
      await mergeQuestions(board.id, targetId, sourceIds);
      return NextResponse.json({ ok: true });
    }

    case "bulkAdd": {
      const lines = String(body.text ?? "")
        .split("\n")
        .map((t) => t.trim())
        .filter((t) => t.length >= 3)
        .slice(0, 200);
      if (lines.length === 0) {
        return NextResponse.json({ error: "Brak pytań do dodania" }, { status: 400 });
      }
      const ipHash = hashIp("admin", slug);
      for (const line of lines) {
        await ingestQuestion(board.id, line, ipHash);
      }
      return NextResponse.json({ added: lines.length });
    }

    default:
      return NextResponse.json({ error: "Nieznana akcja" }, { status: 400 });
  }
}

/** Wylogowanie admina. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const store = await cookies();
  store.delete(adminCookieName(slug));
  return NextResponse.json({ ok: true });
}
