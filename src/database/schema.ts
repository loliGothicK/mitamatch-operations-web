import { pgTable, uniqueIndex, text, timestamp, foreignKey, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { cuid2 } from "drizzle-cuid2/postgres";

export const users = pgTable(
  "User",
  {
    id: cuid2("id").defaultRandom().primaryKey().notNull(),
    discordId: text().notNull(),
    email: text().notNull(),
    name: text().notNull(),
    avatar: text().default("default").notNull(),
    accessToken: text().notNull(),
    refreshToken: text().notNull(),
    createdAt: timestamp({ precision: 3, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3, mode: "string" }).notNull(),
  },
  (table) => [
    uniqueIndex("User_discordId_key").using(
      "btree",
      table.discordId.asc().nullsLast().op("text_ops"),
    ),
    uniqueIndex("User_email_key").using("btree", table.email.asc().nullsLast().op("text_ops")),
  ],
);

export const decks = pgTable(
  "Deck",
  {
    id: cuid2("id").defaultRandom().primaryKey().notNull(),
    userId: text(),
    short: text().unique(),
    full: text().notNull(),
    createdAt: timestamp({ precision: 3, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3, mode: "string" }).notNull(),
  },
  (table) => [
    uniqueIndex("Deck_userId_key").using("btree", table.userId.asc().nullsLast().op("text_ops")),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "Deck_userId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    check("check_either", sql`("userId" IS NOT NULL) OR (short IS NOT NULL)`),
  ],
);

export const timelines = pgTable(
  "Timeline",
  {
    id: cuid2("id").defaultRandom().primaryKey().notNull(),
    userId: text(),
    short: text().unique(),
    full: text().notNull(),
    createdAt: timestamp({ precision: 3, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3, mode: "string" }).notNull(),
  },
  (table) => [
    uniqueIndex("Timeline_userId_key").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "Timeline_userId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    check("check_either", sql`("userId" IS NOT NULL) OR (short IS NOT NULL)`),
  ],
);
