# Sesja

Ranking pytań egzaminacyjnych na żywo. Studenci po egzaminie wpisują pytanie,
które im się trafiło — aplikacja grupuje podobne wpisy (embeddingi + pgvector)
i pokazuje animowany ranking w stylu Kahoota.

Każdy może stworzyć tablicę (przedmiot + rok + wykładowca), dostaje
niezgadywalny link do udostępnienia i staje się jej prowadzącym
(moderacja, okno czasowe, dodawanie hurtowe).

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind + Framer Motion
- **Neon** — serverless Postgres z rozszerzeniem `pgvector`
- **Drizzle ORM**
- **OpenAI** `text-embedding-3-small` — matchowanie podobnych pytań
- **Resend** — kody logowania prowadzącego
- Hosting: **Vercel**

## Uruchomienie lokalne

```bash
npm install
cp .env.example .env      # uzupełnij wartości (patrz niżej)
npm run db:init           # włącza rozszerzenie pgvector (raz)
npm run db:push           # tworzy tabele
npm run dev               # http://localhost:3000
```

## Zmienne środowiskowe

Wszystkie opisane w `.env.example`. Najważniejsze:

| Zmienna | Skąd wziąć |
|---|---|
| `DATABASE_URL` | Neon → projekt → Connection Details (wariant pooled, `?sslmode=require`) |
| `ADMIN_JWT_SECRET` | dowolny długi losowy ciąg — `openssl rand -base64 32` |
| `OPENAI_API_KEY` | platform.openai.com → API keys |
| `RESEND_API_KEY` | resend.com → API Keys |
| `EMAIL_FROM` | adres na zweryfikowanej domenie w Resend |
| `NEXT_PUBLIC_APP_URL` | adres aplikacji (np. `https://sesja.app`) |

### Tryby awaryjne (działa nawet bez kluczy)

- **Brak `OPENAI_API_KEY`** → matchowanie działa tylko na identycznym
  (znormalizowanym) tekście. Aplikacja nie przestaje działać, ale gorzej
  grupuje warianty pytań. Wystarczy dodać klucz, by włączyć pełne embeddingi.
- **Brak `RESEND_API_KEY`** → kod logowania prowadzącego wypisuje się w logach
  serwera zamiast iść mailem (przydatne lokalnie).

## Konfiguracja bazy (Neon)

1. Załóż darmowy projekt na [neon.tech](https://neon.tech).
2. Skopiuj connection string do `DATABASE_URL`.
3. `npm run db:init` — włącza `pgvector`.
4. `npm run db:push` — Drizzle tworzy tabele i indeks HNSW.

Neon usypia bazę po ~5 min bezczynności, ale **wznawia się automatycznie**
przy następnym zapytaniu (cold start ~kilkaset ms) — nie wymaga ręcznego
odpauzowania.

## Wdrożenie na Vercel

1. Wrzuć repo na GitHub.
2. Na [vercel.com](https://vercel.com) → New Project → import repo.
3. W ustawieniach projektu dodaj wszystkie zmienne z `.env`.
4. Ustaw `NEXT_PUBLIC_APP_URL` na docelowy adres (np. `https://sesja.app`).
5. Deploy. Pierwszy raz po deployu uruchom `npm run db:init` i `npm run db:push`
   lokalnie z produkcyjnym `DATABASE_URL` (albo z Neon SQL Editora:
   `CREATE EXTENSION IF NOT EXISTS vector;`).
6. Podłącz domenę `sesja.app` w zakładce Domains.

## E-mail (Resend)

Do testów możesz użyć nadawcy `onboarding@resend.dev` (działa od ręki).
Na produkcji dodaj własną domenę w Resend i ustaw `EMAIL_FROM` na adres
z tej domeny — inaczej maile będą lądować w spamie.

## Jak działa matchowanie

Przy każdym wpisie liczony jest embedding tekstu (OpenAI). Nowy wpis jest
porównywany kosinusowo z istniejącymi pytaniami w tej tablicy:

- podobieństwo > `MATCH_THRESHOLD` (domyślnie 0.82) → wpis dolicza się do
  istniejącego pytania,
- w przeciwnym razie powstaje nowe pytanie.

Podczas pisania (debounce 400 ms) aplikacja podpowiada podobne istniejące
pytania — student może kliknąć zamiast wpisywać. Próg podpowiedzi jest niższy
(0.6), żeby pokazać więcej kandydatów.

Próg `MATCH_THRESHOLD` możesz stroić zmienną środowiskową — wyżej = ostrzejsze
(mniej fałszywych scaleń), niżej = agresywniejsze grupowanie.

## Model danych

- `boards` — tablica: przedmiot, rok, wykładowca, e-mail prowadzącego, okno czasowe
- `questions` — kanoniczne pytanie + wektor embeddingu + licznik wystąpień
- `submissions` — każdy surowy wpis (audyt, liczenie, rate-limiting)
- `admin_codes` — jednorazowe kody logowania prowadzącego

## Struktura

```
src/
  app/
    page.tsx                  ekran startowy + tworzenie tablicy
    t/[slug]/page.tsx          strona tablicy (noindex)
    api/boards/...             endpointy REST
  components/                  CreateBoard, BoardClient, Ranking, AddQuestion, AdminPanel
  db/                          schemat i klient Drizzle
  lib/                         embeddingi, matchowanie, auth, e-mail, rate-limit
scripts/init-db.mjs            włączenie pgvector
```
