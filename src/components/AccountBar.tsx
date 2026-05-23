"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/neon-auth-client";

/** Pasek konta na stronie głównej: kto jest zalogowany + wylogowanie. */
export default function AccountBar({ name }: { name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await authClient.signOut();
    } catch {
      /* i tak odświeżamy stan sesji */
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3 text-sm text-indigo-200/70">
      <span className="truncate">
        Zalogowano jako <span className="font-semibold text-indigo-100">{name}</span>
      </span>
      <button
        onClick={logout}
        disabled={busy}
        className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-indigo-200/80 transition hover:bg-white/5 disabled:opacity-60"
      >
        {busy ? "Wylogowuję…" : "Wyloguj"}
      </button>
    </div>
  );
}
