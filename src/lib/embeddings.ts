/**
 * Embeddingi tekstu przez OpenAI (text-embedding-3-small, 1536 wymiarów).
 * Koszt: ~$0.02 / 1M tokenów — cała sesja egzaminacyjna to kilka groszy.
 *
 * Gdy OPENAI_API_KEY nie jest ustawiony, funkcja zwraca null, a matchowanie
 * przechodzi w tryb awaryjny (porównanie znormalizowanego tekstu).
 */

const MODEL = "text-embedding-3-small";

export function embeddingsEnabled(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

export async function embed(text: string): Promise<number[] | null> {
  const input = text.trim();
  if (!input || !process.env.OPENAI_API_KEY) return null;

  try {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ model: MODEL, input }),
    });

    if (!res.ok) {
      console.error("OpenAI embeddings error:", res.status, await res.text());
      return null;
    }

    const data = (await res.json()) as {
      data: { embedding: number[] }[];
    };
    return data.data[0]?.embedding ?? null;
  } catch (err) {
    console.error("OpenAI embeddings request failed:", err);
    return null;
  }
}
