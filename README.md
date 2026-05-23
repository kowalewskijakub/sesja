# Sesja

Ranking pytań egzaminacyjnych na żywo. Studenci po egzaminie wpisują pytanie,
które im się trafiło — aplikacja automatycznie grupuje podobne wpisy
(embeddingi + pgvector) i układa je w animowany ranking.

Każdy zalogowany użytkownik może stworzyć tablicę (przedmiot + rok + wykładowca),
dostaje prywatny link do udostępnienia i zostaje jej organizatorem
(moderacja, okno czasowe, dodawanie hurtowe). Reszta grupy dodaje pytania
**bez logowania**.

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind + Framer Motion
- **Neon** — serverless Postgres z rozszerzeniem `pgvector`
- **Neon Auth** (Better Auth) — logowanie prowadzącego
- **Drizzle ORM**
- **OpenRouter** — embeddingi do matchowania pytań (domyślnie `openai/text-embedding-3-small`)
- Hosting: **Vercel**

## Uruchomienie lokalne

```bash
npm install
cp .env.example .env      # uzupełnij wartości (patrz niżej)
npm run db:init           # włącza rozszerzenie pgvector (raz)
npm run db:push           # tworzy tabele aplikacji
npm run dev               # http://localhost:3000
```

> `.npmrc` ustawia `legacy-peer-deps=true` — pakiet `@neondatabase/auth`
> (beta) deklaruje peer-zależność na Next.js 16, a my działamy na 15.
> Flaga sprawia, że `npm install` (lokalnie i na Vercelu) przechodzi bez błędu.

## Zmienne środowiskowe

Wszystkie opisane w `.env.example`:

| Zmienna | Skąd wziąć |
|---|---|
| `DATABASE_URL` | Neon → Dashboard → Connection Details (wariant pooled) |
| `NEON_AUTH_BASE_URL` | Neon → Project → Branch → Auth → Configuration (Auth URL) |
| `NEON_AUTH_COOKIE_SECRET` | losowy ciąg min. 32 znaki — `openssl rand -base64 32` |
| `OPENROUTER_API_KEY` | openrouter.ai/settings/keys |
| `NEXT_PUBLIC_APP_URL` | adres aplikacji (np. `https://sesja.app`) |

### Tryb awaryjny embeddingów

Bez `OPENROUTER_API_KEY` matchowanie działa tylko na identycznym
(znormalizowanym) tekście — aplikacja nie przestaje działać, ale gorzej
grupuje warianty pytań. Dodanie klucza włącza pełne embeddingi.

Model embeddingów ustawia `EMBEDDING_MODEL` (domyślnie
`openai/text-embedding-3-small`, 1536 wymiarów). Inne modele dostępne są na
openrouter.ai/models z filtrem embeddings — jeśli wybrany model ma inną liczbę
wymiarów, trzeba zmienić `EMBEDDING_DIM` w `src/db/schema.ts` i ponownie
zmigrować bazę.

## Konfiguracja Neon (baza + Auth)

1. Załóż darmowy projekt na [neon.tech](https://neon.tech).
2. Skopiuj connection string do `DATABASE_URL`.
3. W projekcie Neon otwórz zakładkę **Auth** i kliknij **Enable Neon Auth**.
4. W **Auth → Configuration** wybierz framework **Next.js** i skopiuj **Auth URL**
   do `NEON_AUTH_BASE_URL`.
5. `npm run db:init` — włącza `pgvector`.
6. `npm run db:push` — Drizzle tworzy tabele aplikacji (`boards`, `questions`,
   `submissions`). Tabele użytkowników w schemacie `neon_auth` tworzy i utrzymuje
   samo Neon Auth.

Neon usypia bazę po ~5 min bezczynności, ale **wznawia się automatycznie**
przy następnym zapytaniu — bez ręcznego odpauzowania.

## Logowanie organizatora (Neon Auth)

- Studenci dodają pytania anonimowo — bez konta.
- Twórca tablicy zakłada konto (e-mail + hasło) przy tworzeniu tablicy.
  Obsługą logowania, sesji i wysyłki maili zajmuje się Neon Auth — nie ma
  własnej tabeli kodów ani integracji z zewnętrznym dostawcą maili.
- Panel moderacji na stronie tablicy odblokowuje się, gdy zalogowany użytkownik
  jest właścicielem (`boards.owner_id` = ID użytkownika z `neon_auth`).
- Endpointy `/api/auth/[...path]` obsługuje handler Neon Auth.

Po wdrożeniu dodaj produkcyjny adres aplikacji do sekcji **trusted domains**
w ustawieniach Neon Auth.

## Wdrożenie na Vercel

1. Wrzuć repo na GitHub.
2. Na [vercel.com](https://vercel.com) → New Project → import repo.
3. Dodaj wszystkie zmienne z `.env` w ustawieniach projektu.
4. Ustaw `NEXT_PUBLIC_APP_URL` na docelowy adres (np. `https://sesja.app`).
5. Pierwszy raz po deployu uruchom `npm run db:init` i `npm run db:push`
   lokalnie z produkcyjnym `DATABASE_URL` (lub w Neon SQL Editorze:
   `CREATE EXTENSION IF NOT EXISTS vector;`).
6. Dodaj adres produkcyjny do trusted domains w Neon Auth.
7. Podłącz domenę `sesja.app` w zakładce Domains.

## Jak działa matchowanie

Przy każdym wpisie liczony jest embedding tekstu (OpenRouter). Nowy wpis jest
porównywany kosinusowo z istniejącymi pytaniami w tej tablicy:

- podobieństwo > `MATCH_THRESHOLD` (domyślnie 0.82) → wpis dolicza się do
  istniejącego pytania,
- w przeciwnym razie powstaje nowe pytanie.

Dopasowanie dzieje się automatycznie po wysłaniu wpisu — student nic nie
potwierdza, a powtarzające się pytania łączą się same.

## Model danych

- `boards` — tablica: przedmiot, rok, wykładowca, `owner_id` (z Neon Auth), okno czasowe
- `questions` — kanoniczne pytanie + wektor embeddingu + licznik wystąpień
- `submissions` — każdy surowy wpis (audyt, liczenie, rate-limiting)
- `neon_auth.*` — użytkownicy/sesje (zarządzane przez Neon Auth)

## Struktura

```
src/
  app/
    page.tsx                  ekran startowy + logowanie + tworzenie tablicy
    t/[slug]/page.tsx          strona tablicy (noindex)
    api/auth/[...path]/        handler Neon Auth
    api/boards/...             endpointy REST aplikacji
  components/                  CreateBoard, BoardClient, Ranking, AddQuestion,
                               AdminPanel, AuthForm
  db/                          schemat i klient Drizzle
  lib/                         neon-auth-server/client, auth (helpery),
                               embeddingi, matchowanie, rate-limit
scripts/init-db.mjs            włączenie pgvector
```
