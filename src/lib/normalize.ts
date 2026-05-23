/** Tekst widoczny w rankingu — czyszczenie białych znaków, pierwsza litera duża. */
export function tidyText(input: string): string {
  const t = input.replace(/\s+/g, " ").trim();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/**
 * Klucz porównawczy do trybu awaryjnego matchowania (gdy brak embeddingów).
 * Lowercase, bez ogonków, bez interpunkcji — łapie literówki i drobne różnice.
 */
export function normalizeKey(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
