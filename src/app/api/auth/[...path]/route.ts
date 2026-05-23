import { auth } from "@/lib/neon-auth-server";

// Wszystkie żądania Neon Auth (logowanie, rejestracja, sesja) przechodzą tędy.
export const { GET, POST } = auth.handler();
