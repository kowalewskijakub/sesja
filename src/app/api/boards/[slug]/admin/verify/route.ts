import { NextResponse } from "next/server";

// Weryfikację logowania prowadzącego obsługuje teraz Neon Auth (/api/auth).
// Ten endpoint pozostawiony dla zgodności — zwraca 410 Gone.
export async function POST() {
  return NextResponse.json(
    { error: "Logowanie odbywa się teraz przez Neon Auth" },
    { status: 410 },
  );
}
