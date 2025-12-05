import { relations } from "drizzle-orm/relations";
import { users, decks, timelines, usersToMemoria, memoria } from "@/database/schema";

export const deckRelations = relations(decks, ({ one }) => ({
  user: one(users, {
    fields: [decks.userId],
    references: [users.id],
  }),
}));

export const userRelations = relations(users, ({ many }) => ({
  decks: many(decks),
  timelines: many(timelines),
}));

export const timelineRelations = relations(timelines, ({ one }) => ({
  user: one(users, {
    fields: [timelines.userId],
    references: [users.id],
  }),
}));

// usersテーブルのリレーション定義
export const usersRelations = relations(users, ({ many }) => ({
  // ユーザーは中間テーブルを通じて複数の Memoria を所持
  usersToMemoria: many(usersToMemoria),
}));

// memoriaテーブルのリレーション定義
export const memoriaRelations = relations(memoria, ({ many }) => ({
  // Memoria定義は中間テーブルを通じて複数のユーザーに所持される
  usersToMemoria: many(usersToMemoria),
}));

// usersToMemoriaテーブルのリレーション定義
export const usersToMemoriaRelations = relations(usersToMemoria, ({ one }) => ({
  // 中間テーブルのレコードは、一つのユーザーに紐づく
  user: one(users, {
    fields: [usersToMemoria.userId],
    references: [users.id],
  }),
  // 中間テーブルのレコードは、一つの Memoria 定義に紐づく
  memoria: one(memoria, {
    fields: [usersToMemoria.memoriaId],
    references: [memoria.id],
  }),
}));
