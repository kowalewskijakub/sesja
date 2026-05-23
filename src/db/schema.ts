import {
  pgTable,
  serial,
  integer,
  text,
  varchar,
  boolean,
  timestamp,
  vector,
  index,
} from "drizzle-orm/pg-core";

/**
 * Wymiar wektora embeddingu.
 * OpenAI text-embedding-3-small -> 1536.
 * Jeśli zmienisz providera embeddingów, dostosuj tę wartość i zrób migrację.
 */
export const EMBEDDING_DIM = 1536;

/** Tablica = jeden przedmiot + rok akademicki + wykładowca. */
export const boards = pgTable("boards", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 32 }).notNull().unique(),
  subject: text("subject").notNull(),
  year: text("year").notNull(),
  lecturer: text("lecturer").notNull(),
  adminEmail: text("admin_email").notNull(),
  // Okno czasowe na dodawanie pytań. NULL = bez ograniczenia.
  submissionFrom: timestamp("submission_from", { withTimezone: true }),
  submissionTo: timestamp("submission_to", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Kanoniczne pytanie w rankingu (zgrupowane podobne wpisy). */
export const questions = pgTable(
  "questions",
  {
    id: serial("id").primaryKey(),
    boardId: integer("board_id")
      .notNull()
      .references(() => boards.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    embedding: vector("embedding", { dimensions: EMBEDDING_DIM }),
    count: integer("count").notNull().default(0),
    hidden: boolean("hidden").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    boardIdx: index("questions_board_idx").on(t.boardId),
    embeddingIdx: index("questions_embedding_idx").using(
      "hnsw",
      t.embedding.op("vector_cosine_ops"),
    ),
  }),
);

/** Każdy surowy wpis studenta (do liczenia i audytu / moderacji). */
export const submissions = pgTable(
  "submissions",
  {
    id: serial("id").primaryKey(),
    boardId: integer("board_id")
      .notNull()
      .references(() => boards.id, { onDelete: "cascade" }),
    questionId: integer("question_id").references(() => questions.id, {
      onDelete: "set null",
    }),
    rawText: text("raw_text").notNull(),
    ipHash: text("ip_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    boardIdx: index("submissions_board_idx").on(t.boardId),
  }),
);

/** Jednorazowe kody logowania admina (OTP wysyłany na e-mail). */
export const adminCodes = pgTable("admin_codes", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id")
    .notNull()
    .references(() => boards.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Board = typeof boards.$inferSelect;
export type Question = typeof questions.$inferSelect;
