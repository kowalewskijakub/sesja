import Link from "next/link";
import CreateBoard from "@/components/CreateBoard";
import AccountBar from "@/components/AccountBar";
import { getSessionUser } from "@/lib/auth";
import { getBoardsByOwner } from "@/lib/boards";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getSessionUser();
  const myBoards = user ? await getBoardsByOwner(user.id) : [];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center px-5 py-14">
      {user && (
        <div className="mb-8 flex w-full justify-end">
          <AccountBar name={user.name} />
        </div>
      )}

      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-indigo-200/80">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        Ranking pytań egzaminacyjnych na żywo
      </div>

      <h1 className="text-center text-6xl font-bold tracking-tight text-white sm:text-7xl">
        Sesja<span className="text-violet-400">.</span>
      </h1>
      <p className="mt-4 max-w-md text-center text-base text-indigo-200/70">
        Po egzaminie każdy wpisuje pytanie, które mu się trafiło. Aplikacja
        grupuje podobne wpisy i układa je w ranking — od razu widać, co padało
        najczęściej.
      </p>

      {myBoards.length > 0 && (
        <section className="mt-10 w-full">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-indigo-200/55">
            Twoje tablice
          </h2>
          <ul className="space-y-2">
            {myBoards.map((b) => (
              <li key={b.slug}>
                <Link
                  href={`/t/${b.slug}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 transition hover:border-violet-400/40 hover:bg-white/[0.06]"
                >
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{b.subject}</div>
                    <div className="truncate text-sm text-indigo-200/55">
                      {b.year} · {b.lecturer}
                    </div>
                  </div>
                  <span className="shrink-0 text-indigo-200/40">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <CreateBoard signedIn={!!user} />

      <ol className="mt-12 grid w-full gap-3 sm:grid-cols-3">
        {[
          ["1", "Stwórz tablicę", "Przedmiot, rok i wykładowca — gotowe w kilka sekund."],
          ["2", "Udostępnij link", "Tablicę zobaczą tylko osoby, którym wyślesz link."],
          ["3", "Oglądaj ranking", "Pytania układają się w ranking w czasie rzeczywistym."],
        ].map(([n, t, d]) => (
          <li
            key={n}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/20 text-sm font-bold text-violet-200">
              {n}
            </div>
            <div className="font-semibold">{t}</div>
            <div className="mt-1 text-sm text-indigo-200/60">{d}</div>
          </li>
        ))}
      </ol>
    </main>
  );
}
