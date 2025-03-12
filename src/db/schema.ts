import { pgTable, text, date } from 'drizzle-orm/pg-core';
import { cuid2 } from 'drizzle-cuid2/postgres';

export const decks = pgTable('decks', {
  id: cuid2().defaultRandom().primaryKey(),
  full: text().unique().notNull(),
  short: text().unique().notNull(),
  createdAt: date().defaultNow(),
});

export const timelines = pgTable('timelines', {
  id: cuid2().defaultRandom().primaryKey(),
  full: text().unique().notNull(),
  short: text().unique().notNull(),
  createdAt: date().defaultNow(),
});
