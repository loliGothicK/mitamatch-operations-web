import { relations } from "drizzle-orm/relations";
import { users, decks, timelines } from "@/database/schema";

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
