"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { RankedQuestion } from "@/lib/types";

const RANK_STYLE = [
  { ring: "ring-amber-300/60", badge: "bg-gradient-to-br from-amber-300 to-yellow-500 text-amber-950", bar: "from-amber-300 to-yellow-500" },
  { ring: "ring-slate-300/50", badge: "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900", bar: "from-slate-200 to-slate-400" },
  { ring: "ring-orange-400/50", badge: "bg-gradient-to-br from-orange-300 to-amber-600 text-orange-950", bar: "from-orange-300 to-amber-600" },
];
const DEFAULT_STYLE = {
  ring: "ring-white/10",
  badge: "bg-white/10 text-indigo-100",
  bar: "from-violet-500 to-violet-400",
};

export default function Ranking({
  questions,
  loaded,
}: {
  questions: RankedQuestion[];
  loaded: boolean;
}) {
  const max = Math.max(1, ...questions.map((q) => q.count));

  if (!loaded) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-2xl border border-white/5 bg-white/[0.03]"
          />
        ))}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-12 text-center">
        <p className="font-semibold">Ranking jest jeszcze pusty</p>
        <p className="mt-1 text-sm text-indigo-200/55">
          Dodaj pierwsze pytanie poniżej — ranking ułoży się sam.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {questions.map((q, i) => {
          const style = RANK_STYLE[i] ?? DEFAULT_STYLE;
          const pct = Math.round((q.count / max) * 100);
          return (
            <motion.div
              key={q.id}
              layout
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              transition={{ type: "spring", stiffness: 480, damping: 38 }}
              className={`relative overflow-hidden rounded-2xl border border-white/10 bg-panel/80 p-3 ring-1 ${style.ring}`}
            >
              {/* Pasek tła proporcjonalny do liczby wystąpień */}
              <motion.div
                className={`absolute inset-y-0 left-0 bg-gradient-to-r ${style.bar} opacity-[0.14]`}
                initial={false}
                animate={{ width: `${pct}%` }}
                transition={{ type: "spring", stiffness: 200, damping: 30 }}
              />
              <div className="relative flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold ${style.badge}`}
                >
                  {i + 1}
                </div>
                <p className="min-w-0 flex-1 text-[15px] font-medium leading-snug">
                  {q.text}
                </p>
                <motion.div
                  key={q.count}
                  initial={{ scale: 1.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  className="shrink-0 text-right"
                >
                  <div className="text-xl font-extrabold tabular-nums leading-none">
                    {q.count}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-indigo-200/45">
                    {q.count === 1 ? "raz" : "razy"}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
