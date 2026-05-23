import { and, cosineDistance, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { questions, submissions } from "@/db/schema";
import { embed } from "./embeddings";
import { normalizeKey, tidyText } from "./normalize";

const MATCH_THRESHOLD = Number(process.env.MATCH_THRESHOLD ?? "0.82");

/**
 * Dodaje wpis do tablicy: liczy embedding, szuka dopasowania, zlicza je
 * do istniejącego pytania albo tworzy nowe. Zapisuje też surowy submission.
 */
export async function ingestQuestion(
  boardId: number,
  rawText: string,
  ipHash: string | null,
): Promise<{ questionId: number; matched: boolean }> {
  const text = tidyText(rawText);
  const vec = await embed(text);

  let matchedId: number | null = null;

  if (vec) {
    const similarity = sql<number>`1 - (${cosineDistance(questions.embedding, vec)})`;
    const rows = await db
      .select({ id: questions.id, similarity })
      .from(questions)
      .where(
        and(eq(questions.boardId, boardId), gt(similarity, MATCH_THRESHOLD)),
      )
      .orderBy(desc(similarity))
      .limit(1);
    matchedId = rows[0]?.id ?? null;
  } else {
    // Tryb awaryjny: porównanie znormalizowanego tekstu.
    const key = normalizeKey(text);
    const rows = await db
      .select({ id: questions.id, text: questions.text })
      .from(questions)
      .where(eq(questions.boardId, boardId));
    matchedId = rows.find((r) => normalizeKey(r.text) === key)?.id ?? null;
  }

  let questionId: number;
  if (matchedId !== null) {
    await db
      .update(questions)
      .set({ count: sql`${questions.count} + 1` })
      .where(eq(questions.id, matchedId));
    questionId = matchedId;
  } else {
    const inserted = await db
      .insert(questions)
      .values({ boardId, text, embedding: vec, count: 1 })
      .returning({ id: questions.id });
    questionId = inserted[0].id;
  }

  await db.insert(submissions).values({ boardId, questionId, rawText: text, ipHash });
  return { questionId, matched: matchedId !== null };
}

/**
 * Scala pytania źródłowe w docelowe: przepina submissiony, sumuje liczniki,
 * usuwa pytania źródłowe. Używane przez panel admina.
 */
export async function mergeQuestions(
  boardId: number,
  targetId: number,
  sourceIds: number[],
): Promise<void> {
  const sources = sourceIds.filter((id) => id !== targetId);
  if (sources.length === 0) return;

  for (const sourceId of sources) {
    const src = await db
      .select({ count: questions.count, boardId: questions.boardId })
      .from(questions)
      .where(eq(questions.id, sourceId));
    if (!src[0] || src[0].boardId !== boardId) continue;

    await db
      .update(submissions)
      .set({ questionId: targetId })
      .where(eq(submissions.questionId, sourceId));

    await db
      .update(questions)
      .set({ count: sql`${questions.count} + ${src[0].count}` })
      .where(eq(questions.id, targetId));

    await db.delete(questions).where(eq(questions.id, sourceId));
  }
}
