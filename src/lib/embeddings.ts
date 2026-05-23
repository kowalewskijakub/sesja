/**
 * Embeddingi tekstu przez OpenRouter (POST /api/v1/embeddings).
 *
 * Domyślny model: openai/text-embedding-3-small (1536 wymiarów) — zgodny
 * z kolumną vector(1536) w bazie. Endpoint OpenRouter jest zgodny z formatem
 * OpenAI, więc odpowiedź ma kształt { data: [{ embedding: number[] }] }.
 *
 * UWAGA: zmiana EMBEDDING_MODEL na model o innej liczbie wymiarów wymaga
 * zmiany EMBEDDING_DIM w src/db/schema.ts i ponownej migracji bazy.
 *
 * Bez OPENROUTER_API_KEY embed() zwraca null, a matchowanie przechodzi
 * w tryb awaryjny (porównanie znormalizowanego tekstu).
 */

const MODEL = process.env.EMBEDDING_MODEL || "openai/text-embedding-3-small";
const ENDPOINT = "https://openrouter.ai/api/v1/embeddings";

export function embeddingsEnabled(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}

export async function embed(text: string): Promise<number[] | null> {
  const input = text.trim();
  if (!input || !process.env.OPENROUTER_API_KEY) return null;

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        // Opcjonalne nagłówki OpenRoutera — pomagają identyfikować ruch.
        "X-Title": "Sesja",
      },
      body: JSON.stringify({ model: MODEL, input }),
    });

    if (!res.ok) {
      console.error(
        "OpenRouter embeddings error:",
        res.status,
        await res.text(),
      );
      return null;
    }

    const data = (await res.json()) as {
      data: { embedding: number[] }[];
    };
    return data.data[0]?.embedding ?? null;
  } catch (err) {
    console.error("OpenRouter embeddings request failed:", err);
    return null;
  }
}
