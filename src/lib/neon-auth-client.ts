"use client";

import { createAuthClient } from "@neondatabase/auth/next";

/** Klient Neon Auth do operacji w przeglądarce (logowanie, rejestracja, wylogowanie). */
export const authClient = createAuthClient();
