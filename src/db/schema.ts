import { pgTable, text, date } from 'drizzle-orm/pg-core';
import { cuid2 } from 'drizzle-cuid2/postgres';

export const decksTable = pgTable('decks', {
  id: cuid2().defaultRandom().primaryKey(),
  full: text().unique().notNull(),
  short: text().unique().notNull(),
  createdAt: date().defaultNow(),
});

export const timelinesTable = pgTable('timelines', {
  id: cuid2().defaultRandom().primaryKey(),
  full: text().unique(),
  short: text().unique(),
  createdAt: date().defaultNow(),
});
