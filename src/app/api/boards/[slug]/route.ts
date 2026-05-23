import { NextResponse } from "next/server";
import { getBoardBySlug, windowStatus } from "@/lib/boards";
import { isAdmin } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const board = await getBoardBySlug(slug);
  if (!board) {
    return NextResponse.json({ error: "Nie znaleziono tablicy" }, { status: 404 });
  }

  const status = windowStatus(board);
  const admin = await isAdmin(slug, board.id);

  return NextResponse.json({
    slug: board.slug,
    subject: board.subject,
    year: board.year,
    lecturer: board.lecturer,
    submissionFrom: board.submissionFrom,
    submissionTo: board.submissionTo,
    windowOpen: status.open,
    windowLabel: status.label,
    isAdmin: admin,
  });
}
