import "dotenv/config";
import memoriaData from "../src/domain/memoria/memoria.json";
import orderData from "../src/domain/order/order.json";
import { drizzle } from "drizzle-orm/neon-http";
import { z } from "zod";
import { memoria, order } from "@/database/schema";
import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";

// 1. Neon接続
const db = drizzle(neon(process.env.POSTGRES_URL!));

// 2. 入力JSONの検証スキーマ（加工前の形）
const memoriaColumnSchema = z.object({
  uniqueId: z.string(),
  name: z.string(),
});

const orderColumnSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
});

async function main() {
  const memoriaToInsert: (typeof memoria.$inferInsert)[] = memoriaData.data.map((item: unknown) => {
    // バリデーション（失敗したらここで落ちてくれる）
    const source = memoriaColumnSchema.parse(item);

    // 変換ロジック
    return {
      id: source.uniqueId,
      uniqueId: source.uniqueId,
      name: source.name,
    };
  });

  const uniqueItems = [...new Map(memoriaToInsert.map((item) => [item.id, item])).values()];

  console.log(`🚀 Inserting ${uniqueItems.length} records...`);

  // 4. バッチインサート (チャンク分割推奨)
  // Neon(HTTP)にはペイロード制限があるため、数千件ある場合は分割する
  const CHUNK_SIZE = 1000;
  for (let i = 0; i < uniqueItems.length; i += CHUNK_SIZE) {
    const chunk = uniqueItems.slice(i, i + CHUNK_SIZE);

    await db
      .insert(memoria)
      .values(chunk)
      // 既にIDが存在する場合は更新する設定（Upsert）
      .onConflictDoUpdate({
        target: memoria.id,
        set: {
          name: sql`excluded.name`,
          uniqueId: sql`excluded.unique_id`,
        },
      });

    console.log(`✅ Chunk ${i / CHUNK_SIZE + 1} done.`);
  }

  // order
  const orderToInsert: (typeof order.$inferInsert)[] = orderData.data.map((item: unknown) => {
    // バリデーション（失敗したらここで落ちてくれる）
    const source = orderColumnSchema.parse(item);

    // 変換ロジック
    return {
      id: source.id,
      name: source.name,
    };
  });

  console.log(`🚀 Inserting ${orderToInsert.length} records...`);
  await db
    .insert(order)
    .values(orderToInsert)
    // 既にIDが存在する場合は更新する設定（Upsert）
    .onConflictDoUpdate({
      target: order.id,
      set: {
        name: sql`excluded.name`,
      },
    });

  console.log("🎉 All done!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
