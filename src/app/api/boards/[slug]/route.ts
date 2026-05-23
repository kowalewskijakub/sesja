import { NextResponse } from "next/server";
import { getBoardBySlug, windowStatus } from "@/lib/boards";
import { isBoardOwner } from "@/lib/auth";

export const dynamic = "force-dynamic";

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
  const admin = await isBoardOwner(board);

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
