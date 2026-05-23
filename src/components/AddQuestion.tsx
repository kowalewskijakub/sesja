"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Suggestion } from "@/lib/types";

export default function AddQuestion({
  slug,
  windowOpen,
  onAdded,
}: {
  slug: string;
  windowOpen: boolean;
  onAdded: () => void;
}) {
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState("");
  const [error, setError] = useState("");
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Podpowiedzi na żywo — debounce 400 ms po ostatnim wciśnięciu klawisza.
  useEffect(() => {
    const q = text.trim();
    if (q.length < 3 || q.includes("\n")) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/boards/${slug}/suggest`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: q }),
        });
        if (!res.ok) return;
        const data = await res.json();
        setSuggestions(data.suggestions ?? []);
      } catch {
        /* ignorujemy */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [text, slug]);

  function showFlash(msg: string) {
    setFlash(msg);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(""), 2200);
  }

  async function send(payload: { text?: string; texts?: string[] }) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/boards/${slug}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Nie udało się dodać");
      setText("");
      setSuggestions([]);
      showFlash(
        data.added > 1 ? `Dodano ${data.added} pytań ✓` : "Dodano ✓",
      );
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się dodać");
    } finally {
      setBusy(false);
    }
  }

  function submitTyped() {
    const q = text.trim();
    if (q.length < 3) {
      setError("Wpisz treść pytania (min. 3 znaki)");
      return;
    }
    send({ text: q });
  }

  if (!windowOpen) {
    return (
      <div className="fixed inset-x-0 bottom-0">
        <div className="mx-auto max-w-2xl px-4 pb-4">
          <div className="rounded-2xl border border-white/10 bg-panel/95 px-4 py-3 text-center text-sm text-indigo-200/60 backdrop-blur">
            Dodawanie pytań jest teraz zamknięte — ranking możesz oglądać dalej.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0">
      <div className="mx-auto max-w-2xl px-4 pb-4">
        {/* Podpowiedzi: kliknij, żeby dorzucić głos do istniejącego pytania */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mb-2 space-y-1.5"
            >
              <div className="px-1 text-[11px] font-medium uppercase tracking-wide text-violet-300/70">
                💡 Już ktoś pytał o to samo? Kliknij zamiast wpisywać
              </div>
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => send({ text: s.text })}
                  disabled={busy}
                  className="flex w-full items-center gap-2 rounded-xl border border-violet-400/25 bg-violet-500/10 px-3 py-2 text-left text-sm hover:bg-violet-500/20 disabled:opacity-50"
                >
                  <span className="min-w-0 flex-1 truncate">{s.text}</span>
                  <span className="shrink-0 rounded-md bg-white/10 px-1.5 py-0.5 text-xs font-semibold">
                    ×{s.count}
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="rounded-2xl border border-white/12 bg-panel/95 p-2 backdrop-blur">
          <div className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitTyped();
                }
              }}
              rows={1}
              placeholder="Jakie pytanie Ci się trafiło?"
              className="max-h-32 min-h-[2.75rem] flex-1 resize-none bg-transparent px-2.5 py-2.5 text-[15px] outline-none placeholder:text-indigo-200/35"
            />
            <button
              onClick={submitTyped}
              disabled={busy}
              className="btn-glow shrink-0 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2.5 font-bold text-white disabled:opacity-60"
            >
              {busy ? "…" : "Dodaj"}
            </button>
          </div>
          <div className="flex items-center justify-between px-2 pb-0.5 pt-1">
            <span className="text-[11px] text-indigo-200/40">
              Enter wysyła · Shift+Enter lub wklejenie = wiele pytań naraz
            </span>
            <AnimatePresence mode="wait">
              {flash && (
                <motion.span
                  key={flash}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[11px] font-semibold text-emerald-300"
                >
                  {flash}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          {error && (
            <div className="px-2 pb-1 text-[12px] text-rose-300">{error}</div>
          )}
        </div>
      </div>
    </div>
  );
}
