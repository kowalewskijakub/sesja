"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthForm from "./AuthForm";

const currentYear = new Date().getFullYear();
const yearOptions = [
  `${currentYear - 1}/${currentYear}`,
  `${currentYear}/${currentYear + 1}`,
];

export default function CreateBoard({
  signedInName,
}: {
  signedInName: string | null;
}) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [year, setYear] = useState(yearOptions[0]);
  const [lecturer, setLecturer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [createdSlug, setCreatedSlug] = useState("");
  const [copied, setCopied] = useState(false);

  const shareUrl = createdSlug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/t/${createdSlug}`
    : "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, year, lecturer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Coś poszło nie tak");
      setCreatedSlug(data.slug);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Coś poszło nie tak");
    } finally {
      setBusy(false);
    }
  }

  // --- Niezalogowany: logowanie / rejestracja prowadzącego ---
  if (!signedInName) {
    return (
      <div className="mt-9 w-full rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
        <div className="text-lg font-bold">Zacznij od konta prowadzącego</div>
        <p className="mb-4 mt-0.5 text-sm text-indigo-200/60">
          Konto potrzebne jest tylko do założenia i moderowania tablicy.
          Studenci dodają pytania bez logowania.
        </p>
        <AuthForm onSuccess={() => router.refresh()} compact />
      </div>
    );
  }

  // --- Po utworzeniu tablicy: link do udostępnienia ---
  if (createdSlug) {
    return (
      <div className="mt-9 w-full rounded-3xl border border-emerald-400/25 bg-emerald-400/[0.06] p-6">
        <div className="text-lg font-bold">Tablica gotowa! 🎉</div>
        <p className="mt-1 text-sm text-indigo-200/70">
          Udostępnij ten link grupie. Tylko osoby z linkiem trafią na tablicę.
        </p>
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 p-1.5">
          <input
            readOnly
            value={shareUrl}
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-indigo-100 outline-none"
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(shareUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            }}
            className="shrink-0 rounded-lg bg-violet-500 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-400"
          >
            {copied ? "Skopiowano" : "Kopiuj"}
          </button>
        </div>
        <button
          onClick={() => router.push(`/t/${createdSlug}`)}
          className="btn-glow mt-4 w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-3 font-bold text-white"
        >
          Przejdź do tablicy →
        </button>
        <p className="mt-3 text-xs text-indigo-200/50">
          Jesteś prowadzącym tej tablicy. Panel moderacji odblokujesz na stronie
          tablicy — wystarczy, że jesteś zalogowany.
        </p>
      </div>
    );
  }

  // --- Zalogowany: formularz tworzenia tablicy ---
  return (
    <form
      onSubmit={submit}
      className="mt-9 w-full rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur"
    >
      <div className="flex items-center justify-between">
        <div className="text-lg font-bold">Nowa tablica</div>
        <span className="rounded-full bg-violet-500/15 px-2.5 py-1 text-xs text-violet-200">
          {signedInName}
        </span>
      </div>
      <p className="mb-4 mt-0.5 text-sm text-indigo-200/60">
        Jedna tablica = jeden przedmiot, rok i wykładowca.
      </p>

      <label className="mb-3 block">
        <span className="mb-1 block text-xs font-medium text-indigo-200/70">
          Przedmiot
        </span>
        <input
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="np. Postępowanie cywilne"
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-[15px] outline-none placeholder:text-indigo-200/30 focus:border-violet-400/60"
        />
      </label>

      <div className="mb-1 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-indigo-200/70">
            Rok akademicki
          </span>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-[15px] outline-none focus:border-violet-400/60"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y} className="bg-ink">
                {y}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-indigo-200/70">
            Wykładowca
          </span>
          <input
            required
            value={lecturer}
            onChange={(e) => setLecturer(e.target.value)}
            placeholder="np. dr Kowalski"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-[15px] outline-none placeholder:text-indigo-200/30 focus:border-violet-400/60"
          />
        </label>
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="btn-glow mt-5 w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-3 font-bold text-white disabled:opacity-60"
      >
        {busy ? "Tworzę…" : "Stwórz tablicę"}
      </button>
    </form>
  );
}
