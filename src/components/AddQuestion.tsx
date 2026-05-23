"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

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
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState("");
  const [error, setError] = useState("");
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showFlash(msg: string) {
    setFlash(msg);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(""), 2200);
  }

  async function submit() {
    const q = text.trim();
    if (q.length < 3) {
      setError("Wpisz treść pytania (min. 3 znaki)");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/boards/${slug}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Nie udało się dodać");
      setText("");
      showFlash("Dodano ✓");
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się dodać");
    } finally {
      setBusy(false);
    }
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
        <div className="rounded-2xl border border-white/12 bg-panel/95 p-2 backdrop-blur">
          <div className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={1}
              placeholder="Jakie pytanie Ci się trafiło?"
              className="max-h-32 min-h-[2.75rem] flex-1 resize-none bg-transparent px-2.5 py-2.5 text-[15px] outline-none placeholder:text-indigo-200/35"
            />
            <button
              onClick={submit}
              disabled={busy}
              className="btn-glow shrink-0 rounded-xl bg-violet-600 px-4 py-2.5 font-bold text-white transition hover:bg-violet-500 disabled:opacity-60"
            >
              {busy ? "…" : "Dodaj"}
            </button>
          </div>
          <div className="flex items-center justify-between px-2 pb-0.5 pt-1">
            <span className="text-[11px] text-indigo-200/40">
              Enter wysyła. Powtarzające się pytania połączą się same.
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
