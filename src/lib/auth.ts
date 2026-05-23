import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET ?? "dev-secret-zmien-mnie",
);

export function adminCookieName(slug: string): string {
  return `sesja_admin_${slug}`;
}

/** Podpisuje token sesji admina ważny 30 dni. */
export async function signAdminToken(boardId: number): Promise<string> {
  return new SignJWT({ boardId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

async function boardIdFromToken(token: string | undefined): Promise<number | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return typeof payload.boardId === "number" ? payload.boardId : null;
  } catch {
    return null;
  }
}

/** Sprawdza, czy bieżący request ma ważną sesję admina dla danej tablicy. */
export async function isAdmin(slug: string, boardId: number): Promise<boolean> {
  const store = await cookies();
  const token = store.get(adminCookieName(slug))?.value;
  const id = await boardIdFromToken(token);
  return id === boardId;
}

/** Generuje 6-cyfrowy kod OTP. */
export function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
