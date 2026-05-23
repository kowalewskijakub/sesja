import { eq } from "drizzle-orm";
import { db } from "@/db";
import { boards, type Board } from "@/db/schema";

export async function getBoardBySlug(slug: string): Promise<Board | null> {
  const rows = await db.select().from(boards).where(eq(boards.slug, slug)).limit(1);
  return rows[0] ?? null;
}

/** Czy okno czasowe na dodawanie pytań jest teraz otwarte. */
export function submissionWindowOpen(board: Board): boolean {
  const now = Date.now();
  if (board.submissionFrom && now < board.submissionFrom.getTime()) return false;
  if (board.submissionTo && now > board.submissionTo.getTime()) return false;
  return true;
}

/** Tekstowy status okna — do wyświetlenia użytkownikowi. */
export function windowStatus(board: Board): {
  open: boolean;
  label: string;
} {
  const open = submissionWindowOpen(board);
  const fmt = (d: Date) =>
    d.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" });

  if (open) {
    if (board.submissionTo) {
      return { open: true, label: `Dodawanie pytań otwarte do ${fmt(board.submissionTo)}` };
    }
    return { open: true, label: "Dodawanie pytań otwarte bezterminowo" };
  }
  if (board.submissionFrom && Date.now() < board.submissionFrom.getTime()) {
    return { open: false, label: `Dodawanie pytań rusza ${fmt(board.submissionFrom)}` };
  }
  return { open: false, label: "Dodawanie pytań zostało zamknięte" };
}
