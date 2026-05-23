import type { Board } from "@/db/schema";
import { auth } from "./neon-auth-server";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

/** Zwraca zalogowanego użytkownika (prowadzącego) albo null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const { data } = await auth.getSession();
    const user = data?.user;
    if (!user) return null;
    return {
      id: String(user.id),
      email: String(user.email ?? ""),
      name: String(user.name ?? user.email ?? ""),
    };
  } catch {
    return null;
  }
}

/** Czy zalogowany użytkownik jest prowadzącym danej tablicy. */
export async function isBoardOwner(board: Board): Promise<boolean> {
  const user = await getSessionUser();
  return !!user && user.id === board.ownerId;
}
