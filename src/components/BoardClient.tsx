"use client";

import { useCallback, useEffect, useState } from "react";
import type { RankedQuestion } from "@/lib/types";
import Ranking from "./Ranking";
import AddQuestion from "./AddQuestion";
import AdminPanel from "./AdminPanel";

interface Props {
  slug: string;
  subject: string;
  year: string;
  lecturer: string;
  windowOpen: boolean;
  windowLabel: string;
  initialIsAdmin: boolean;
}

const POLL_MS = 2500;

export default function BoardClient({
  slug,
  subject,
  year,
  lecturer,
  windowOpen: initialWindowOpen,
  windowLabel: initialWindowLabel,
  initialIsAdmin,
}: Props) {
  const [questions, setQuestions] = useState<RankedQuestion[]>([]);
  const [windowOpen, setWindowOpen] = useState(initialWindowOpen);
  const [windowLabel, setWindowLabel] = useState(initialWindowLabel);
  const [isAdmin, setIsAdmin] = useState(initialIsAdmin);
  const [adminOpen, setAdminOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const refreshRanking = useCallback(async () => {
    try {
      const res = await fetch(`/api/boards/${slug}/questions`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      setQuestions(data.questions ?? []);
      setLoaded(true);
    } catch {
      /* sieć — spróbujemy przy następnym pollingu */
    }
  }, [slug]);

  const refreshMeta = useCallback(async () => {
    try {
      const res = await fetch(`/api/boards/${slug}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setWindowOpen(data.windowOpen);
      setWindowLabel(data.windowLabel);
    } catch {
      /* ignorujemy */
    }
  }, [slug]);

  useEffect(() => {
    refreshRanking();
    const id = setInterval(refreshRanking, POLL_MS);
    return () => clearInterval(id);
  }, [refreshRanking]);

  const total = questions.reduce((s, q) => s + q.count, 0);

  return (
    <main className="mx-auto max-w-2xl px-4 pb-32 pt-8 sm:px-5">
      <header className="mb-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <a
              href="/"
              className="text-xs font-bold uppercase tracking-widest text-indigo-200/60 transition hover:text-indigo-100"
            >
              Sesja
            </a>
            <h1 className="mt-1 text-2xl font-extrabold leading-tight sm:text-3xl">
              {subject}
            </h1>
            <p className="mt-0.5 text-sm text-indigo-200/60">
              {year} · {lecturer}
            </p>
          </div>
          <button
            onClick={() => setAdminOpen(true)}
            className="shrink-0 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-indigo-200/80 transition hover:bg-white/[0.08]"
          >
            {isAdmin ? "Panel" : "Organizator"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              windowOpen
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-rose-500/15 text-rose-300"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                windowOpen ? "bg-emerald-400" : "bg-rose-400"
              }`}
            />
            {windowLabel}
          </span>
          <span className="rounded-full bg-white/[0.05] px-3 py-1 text-xs text-indigo-200/60">
            {total} {total === 1 ? "wpis" : "wpisów"} · {questions.length}{" "}
            {questions.length === 1 ? "pytanie" : "pytań"}
          </span>
        </div>
      </header>

      <Ranking questions={questions} loaded={loaded} />

      <AddQuestion
        slug={slug}
        windowOpen={windowOpen}
        onAdded={refreshRanking}
      />

      {adminOpen && (
        <AdminPanel
          slug={slug}
          isAdmin={isAdmin}
          onClose={() => setAdminOpen(false)}
          onAdminChange={(v) => setIsAdmin(v)}
          onDataChange={() => {
            refreshRanking();
            refreshMeta();
          }}
        />
      )}
    </main>
  );
}
