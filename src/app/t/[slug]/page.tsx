import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBoardBySlug, windowStatus } from "@/lib/boards";
import { isAdmin } from "@/lib/auth";
import BoardClient from "@/components/BoardClient";

// Tablice nie powinny trafiać do wyszukiwarek — to linki "tylko dla znających URL".
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function BoardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const board = await getBoardBySlug(slug);
  if (!board) notFound();

  const status = windowStatus(board);
  const admin = await isAdmin(slug, board.id);

  return (
    <BoardClient
      slug={board.slug}
      subject={board.subject}
      year={board.year}
      lecturer={board.lecturer}
      windowOpen={status.open}
      windowLabel={status.label}
      initialIsAdmin={admin}
    />
  );
}
