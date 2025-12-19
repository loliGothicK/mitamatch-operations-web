import {
  pgTable,
  uniqueIndex,
  timestamp,
  varchar,
  integer,
  primaryKey,
  customType,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { ulid as genUlid, ulidToUUID, uuidToULID } from "ulid";
import { Unit } from "@/domain/types";
import { OrderWithPic } from "@/jotai/orderAtoms";

export const ulid = customType<{ data: string; driverData: string }>({
  dataType() {
    return "uuid";
  },

  // 書き込み時: ULID -> UUID
  toDriver(data: string): string {
    return ulidToUUID(data);
  },

  // 読み取り時: UUID -> ULID
  fromDriver(driverData: string): string {
    return uuidToULID(driverData);
  },
});

export const users = pgTable(
  "user",
  {
    id: ulid("id")
      .$defaultFn(() => genUlid())
      .primaryKey()
      .notNull(),
    // 🔑 外部連携キー: Clerk ID を格納
    clerkUserId: varchar("clerk_user_id", { length: 255 }).unique().notNull(),

    // アプリケーション固有のユーザー情報
    name: varchar("name", { length: 255 }).notNull(),

    // Role
    role: varchar("role", { length: 255 }).default("org:member").notNull(),

    // タイムスタンプ
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }),
  },
  (table) => {
    return {
      // 索引定義: clerkUserIdに対してユニークインデックスを明示的に作成
      clerkIdIndex: uniqueIndex("clerk_user_id_idx").on(table.clerkUserId),
    };
  },
);

export type User = typeof users.$inferSelect; // SELECT時の型
export type NewUser = typeof users.$inferInsert; // INSERT時の型

export const organization = pgTable("organization", {
  id: ulid("id")
    .$defaultFn(() => genUlid())
    .primaryKey()
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }),
});

export const organizationMembers = pgTable("organization_members", {
  organizationId: ulid("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  userId: ulid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 255 }).default("org:member").notNull(),
});

export const decks = pgTable("deck", {
  id: ulid("id")
    .$defaultFn(() => genUlid())
    .primaryKey()
    .notNull(),
  userId: ulid("user_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  title: varchar("title", { length: 255 }).notNull().default("no title"),
  short: ulid("short").unique(),
  unit: jsonb("unit").$type<Unit>().notNull(),
  createdAt: timestamp({ precision: 3, mode: "string" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ precision: 3, mode: "string" }).notNull(),
});

export const timelines = pgTable("timeline", {
  id: ulid("id")
    .$defaultFn(() => genUlid())
    .primaryKey()
    .notNull(),
  userId: ulid("user_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  title: varchar("title", { length: 255 }).notNull().default("no title"),
  short: ulid("short").unique(),
  timeline: jsonb().$type<{ timeline: OrderWithPic[] }>().notNull(),
  createdAt: timestamp({ precision: 3, mode: "string" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ precision: 3, mode: "string" }).notNull(),
});

export const memoria = pgTable("memoria", {
  id: ulid("id")
    .$defaultFn(() => genUlid())
    .primaryKey()
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
});

export type Memoria = typeof memoria.$inferSelect;

export const usersToMemoria = pgTable(
  "users_to_memoria",
  {
    // 外部キー 1: users.id を参照 (ユーザーが削除されたら、所持情報も削除)
    userId: ulid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // 外部キー 2: memoria.id を参照 (Memoria定義が削除されたら、所持情報も削除)
    memoriaId: ulid("memoria_id")
      .notNull()
      .references(() => memoria.id, { onDelete: "cascade" }),

    // 所持情報：数量
    limitBreak: integer("limit_break").notNull().default(0),
    // 取得日時
    acquiredAt: timestamp("acquired_at", { withTimezone: true, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => {
    return {
      // 複合主キー: userIdとmemoriaIdの組み合わせを一意にする
      pk: primaryKey({ columns: [table.userId, table.memoriaId] }),
    };
  },
);

export const order = pgTable("order", {
  id: integer("id").primaryKey().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
});

export const ordersToMemoria = pgTable(
  "orders_to_memoria",
  {
    // 外部キー 1: users.id を参照 (ユーザーが削除されたら、所持情報も削除)
    userId: ulid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // 外部キー 2: memoria.id を参照 (Memoria定義が削除されたら、所持情報も削除)
    orderId: integer("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),
  },
  (table) => {
    return {
      // 複合主キー: userIdとmemoriaIdの組み合わせを一意にする
      pk: primaryKey({ columns: [table.userId, table.orderId] }),
    };
  },
);
