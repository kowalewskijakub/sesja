import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 text-center">
      <div className="text-5xl font-bold text-white">
        Sesja<span className="text-violet-400">.</span>
      </div>
      <h1 className="mt-6 text-xl font-bold">Nie znaleziono tablicy</h1>
      <p className="mt-2 text-sm text-indigo-200/60">
        Link jest nieprawidłowy albo tablica została usunięta. Sprawdź, czy
        skopiowałeś cały adres.
      </p>
      <Link
        href="/"
        className="btn-glow mt-6 rounded-xl bg-violet-600 px-5 py-2.5 font-semibold text-white transition hover:bg-violet-500"
      >
        Stwórz własną tablicę
      </Link>
    </main>
  );
}
