import CreateBoard from "@/components/CreateBoard";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center px-5 py-14">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        ranking pytań egzaminacyjnych na żywo
      </div>

      <h1 className="text-center text-6xl font-extrabold tracking-tight sm:text-7xl">
        <span className="text-gradient">Sesja</span>
      </h1>
      <p className="mt-4 max-w-md text-center text-base text-indigo-200/70">
        Po egzaminie każdy wpisuje pytanie, które mu się trafiło. Aplikacja
        grupuje podobne wpisy i pokazuje ranking — na żywo, jak w Kahoocie.
      </p>

      <CreateBoard />

      <ol className="mt-12 grid w-full gap-3 sm:grid-cols-3">
        {[
          ["1", "Stwórz tablicę", "Przedmiot, rok, wykładowca — gotowe w 10 sekund."],
          ["2", "Udostępnij link", "Wyślij niezgadywalny link grupie ze studiów."],
          ["3", "Oglądaj ranking", "Pytania lecą do góry w czasie rzeczywistym."],
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
