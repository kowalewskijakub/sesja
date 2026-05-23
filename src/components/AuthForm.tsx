"use client";

import { useState } from "react";
import { authClient } from "@/lib/neon-auth-client";

/**
 * Logowanie / rejestracja prowadzącego przez Neon Auth.
 * Po sukcesie wywołuje onSuccess() — strona sama odświeża stan sesji.
 */
export default function AuthForm({
  onSuccess,
  compact = false,
}: {
  onSuccess: () => void;
  compact?: boolean;
}) {
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await (mode === "signup"
        ? authClient.signUp.email({ email, password, name })
        : authClient.signIn.email({ email, password }));
      const authError = (res as { error?: { message?: string } | null })?.error;
      if (authError) {
        setError(authError.message || "Nie udało się — sprawdź dane");
        return;
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Coś poszło nie tak");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-[15px] outline-none placeholder:text-indigo-200/30 focus:border-violet-400/60";

  return (
    <form onSubmit={submit} className={compact ? "" : "mt-1"}>
      <div className="mb-3 flex rounded-xl border border-white/10 bg-black/20 p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 rounded-lg py-1.5 font-semibold ${
            mode === "signup" ? "bg-violet-500 text-white" : "text-indigo-200/70"
          }`}
        >
          Załóż konto
        </button>
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`flex-1 rounded-lg py-1.5 font-semibold ${
            mode === "signin" ? "bg-violet-500 text-white" : "text-indigo-200/70"
          }`}
        >
          Mam konto
        </button>
      </div>

      {mode === "signup" && (
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Imię / nick"
          className={`${inputCls} mb-2`}
        />
      )}
      <input
        required
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="E-mail"
        className={`${inputCls} mb-2`}
      />
      <input
        required
        type="password"
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Hasło (min. 8 znaków)"
        className={inputCls}
      />

      {error && (
        <div className="mt-3 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="btn-glow mt-4 w-full rounded-xl bg-violet-600 px-4 py-2.5 font-bold text-white transition hover:bg-violet-500 disabled:opacity-60"
      >
        {busy
          ? "Chwila…"
          : mode === "signup"
            ? "Załóż konto i kontynuuj"
            : "Zaloguj się"}
      </button>
    </form>
  );
}
