import { createNeonAuth } from "@neondatabase/auth/next/server";

/**
 * Serwerowa instancja Neon Auth (Better Auth).
 * Udostępnia: getSession(), signIn/signUp/signOut, handler(), middleware().
 *
 * Placeholdery pozwalają zbudować aplikację bez ustawionych zmiennych
 * środowiskowych — w runtime na Vercelu używane są realne wartości.
 * Uwaga: createNeonAuth wymaga sekretu o długości min. 32 znaków.
 */
const baseUrl =
  process.env.NEON_AUTH_BASE_URL ??
  "https://placeholder.neonauth.example/neondb/auth";

const cookieSecret =
  process.env.NEON_AUTH_COOKIE_SECRET ??
  "sesja-placeholder-cookie-secret-zmien-mnie-w-env";

export const auth = createNeonAuth({
  baseUrl,
  cookies: { secret: cookieSecret },
});
