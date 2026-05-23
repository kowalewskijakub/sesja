"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { AdminQuestion } from "@/lib/types";

interface Props {
  slug: string;
  isAdmin: boolean;
  onClose: () => void;
  onAdminChange: (v: boolean) => void;
  onDataChange: () => void;
}

export default function AdminPanel({
  slug,
  isAdmin,
  onClose,
  onAdminChange,
  onDataChange,
}: Props) {
  const [step, setStep] = useState<"email" | "code" | "panel">(
    isAdmin ? "panel" : "email",
  );
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [bulk, setBulk] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const loadPanel = useCallback(async () => {
    const res = await fetch(`/api/boards/${slug}/admin`, { cache: "no-store" });
    const data = await res.json();
    if (!data.isAdmin) {
      onAdminChange(false);
      setStep("email");
      return;
    }
    setQuestions(data.questions ?? []);
    setFrom(data.submissionFrom ? String(data.submissionFrom).slice(0, 10) : "");
    setTo(data.submissionTo ? String(data.submissionTo).slice(0, 10) : "");
  }, [slug, onAdminChange]);

  useEffect(() => {
    if (step === "panel") loadPanel();
  }, [step, loadPanel]);

  async function requestCode() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/boards/${slug}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Błąd");
      setStep("code");
      setInfo(`Kod wysłany na ${email}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/boards/${slug}/admin/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Błąd");
      onAdminChange(true);
      setInfo("");
      setStep("panel");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd");
    } finally {
      setBusy(false);
    }
  }

  async function patch(body: Record<string, unknown>, okMsg?: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/boards/${slug}/admin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Błąd");
      if (okMsg) {
        setInfo(okMsg);
        setTimeout(() => setInfo(""), 2200);
      }
      setSelected(new Set());
      await loadPanel();
      onDataChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch(`/api/boards/${slug}/admin`, { method: "DELETE" });
    onAdminChange(false);
    onClose();
  }

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function mergeSelected() {
    const chosen = questions.filter((q) => selected.has(q.id));
    if (chosen.length < 2) return;
    const target = [...chosen].sort((a, b) => b.count - a.count)[0];
    const sourceIds = chosen.filter((q) => q.id !== target.id).map((q) => q.id);
    patch(
      { action: "merge", targetId: target.id, sourceIds },
      `Scalono w: „${target.text.slice(0, 30)}…”`,
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-white/12 bg-ink p-5 sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Panel prowadzącego</h2>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-indigo-200/60 hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </div>
        )}
        {info && (
          <div className="mb-3 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            {info}
          </div>
        )}

        {step === "email" && (
          <div>
            <p className="mb-3 text-sm text-indigo-200/65">
              Wpisz e-mail podany przy tworzeniu tablicy — wyślemy kod
              logowania.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ty@example.com"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 outline-none focus:border-violet-400/60"
            />
            <button
              onClick={requestCode}
              disabled={busy}
              className="btn-glow mt-3 w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2.5 font-bold text-white disabled:opacity-60"
            >
              {busy ? "Wysyłam…" : "Wyślij kod"}
            </button>
          </div>
        )}

        {step === "code" && (
          <div>
            <p className="mb-3 text-sm text-indigo-200/65">
              Wpisz 6-cyfrowy kod z e-maila.
            </p>
            <input
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              maxLength={6}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-center text-2xl font-bold tracking-[0.4em] outline-none focus:border-violet-400/60"
            />
            <button
              onClick={verifyCode}
              disabled={busy}
              className="btn-glow mt-3 w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2.5 font-bold text-white disabled:opacity-60"
            >
              {busy ? "Sprawdzam…" : "Zaloguj"}
            </button>
            <button
              onClick={() => setStep("email")}
              className="mt-2 w-full text-xs text-indigo-200/50 hover:text-indigo-200"
            >
              ← zmień e-mail
            </button>
          </div>
        )}

        {step === "panel" && (
          <div className="space-y-6">
            {/* Okno czasowe */}
            <section>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-violet-300/80">
                Okno na dodawanie pytań
              </h3>
              <p className="mb-2 text-xs text-indigo-200/55">
                Zostaw pola puste = bezterminowo. Sama data „do" = otwarte do
                końca tego dnia.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-indigo-200/60">
                  Od
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2.5 py-2 text-sm text-indigo-100 outline-none focus:border-violet-400/60"
                  />
                </label>
                <label className="text-xs text-indigo-200/60">
                  Do
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2.5 py-2 text-sm text-indigo-100 outline-none focus:border-violet-400/60"
                  />
                </label>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() =>
                    patch(
                      { action: "window", from: from || null, to: to || null },
                      "Okno zapisane",
                    )
                  }
                  disabled={busy}
                  className="rounded-lg bg-violet-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-violet-400 disabled:opacity-60"
                >
                  Zapisz okno
                </button>
                <button
                  onClick={() => {
                    setFrom("");
                    setTo("");
                    patch({ action: "window", from: null, to: null }, "Ustawiono bezterminowo");
                  }}
                  disabled={busy}
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-indigo-200/80 hover:bg-white/5 disabled:opacity-60"
                >
                  Bezterminowo
                </button>
              </div>
            </section>

            {/* Hurtowe dodawanie */}
            <section>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-violet-300/80">
                Dodaj wiele pytań naraz
              </h3>
              <textarea
                value={bulk}
                onChange={(e) => setBulk(e.target.value)}
                rows={4}
                placeholder="Jedno pytanie w linii…"
                className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-violet-400/60"
              />
              <button
                onClick={() =>
                  patch({ action: "bulkAdd", text: bulk }, "Dodano pytania").then(
                    () => setBulk(""),
                  )
                }
                disabled={busy || bulk.trim().length < 3}
                className="mt-2 rounded-lg bg-violet-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-violet-400 disabled:opacity-60"
              >
                Dodaj listę
              </button>
            </section>

            {/* Moderacja */}
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wide text-violet-300/80">
                  Moderacja ({questions.length})
                </h3>
                {selected.size >= 2 && (
                  <button
                    onClick={mergeSelected}
                    disabled={busy}
                    className="rounded-lg bg-fuchsia-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-fuchsia-400"
                  >
                    Scal zaznaczone ({selected.size})
                  </button>
                )}
              </div>
              <p className="mb-2 text-xs text-indigo-200/50">
                Zaznacz 2+ pytania i scal je w jedno (liczniki się zsumują).
              </p>
              <div className="space-y-1.5">
                {questions.map((q) => (
                  <div
                    key={q.id}
                    className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 ${
                      q.hidden
                        ? "border-white/5 bg-white/[0.02] opacity-55"
                        : "border-white/10 bg-white/[0.04]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(q.id)}
                      onChange={() => toggleSelect(q.id)}
                      className="h-4 w-4 shrink-0 accent-fuchsia-500"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {q.text}
                    </span>
                    <span className="shrink-0 rounded bg-white/10 px-1.5 text-xs font-bold">
                      {q.count}
                    </span>
                    <button
                      title="Edytuj"
                      onClick={() => {
                        const t = window.prompt("Nowa treść pytania:", q.text);
                        if (t && t.trim().length >= 3)
                          patch({ action: "edit", questionId: q.id, text: t });
                      }}
                      className="shrink-0 rounded px-1.5 py-1 text-xs hover:bg-white/10"
                    >
                      ✏️
                    </button>
                    <button
                      title={q.hidden ? "Pokaż" : "Ukryj"}
                      onClick={() =>
                        patch({
                          action: q.hidden ? "unhide" : "hide",
                          questionId: q.id,
                        })
                      }
                      className="shrink-0 rounded px-1.5 py-1 text-xs hover:bg-white/10"
                    >
                      {q.hidden ? "👁" : "🚫"}
                    </button>
                    <button
                      title="Usuń"
                      onClick={() => {
                        if (window.confirm("Usunąć to pytanie na stałe?"))
                          patch({ action: "delete", questionId: q.id });
                      }}
                      className="shrink-0 rounded px-1.5 py-1 text-xs hover:bg-rose-500/20"
                    >
                      🗑
                    </button>
                  </div>
                ))}
                {questions.length === 0 && (
                  <p className="py-4 text-center text-sm text-indigo-200/45">
                    Brak pytań do moderacji.
                  </p>
                )}
              </div>
            </section>

            <button
              onClick={logout}
              className="w-full rounded-lg border border-white/10 py-2 text-sm text-indigo-200/60 hover:bg-white/5"
            >
              Wyloguj
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
