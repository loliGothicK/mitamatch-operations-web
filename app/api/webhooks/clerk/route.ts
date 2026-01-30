import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { upsertUser } from "@/database"; // あなたのDBロジック
import { NextResponse } from "next/server";

const WEBHOOK_SECRET =
  process.env.NODE_ENV === "development"
    ? process.env.CLERK_WEBHOOK_DEV_SECRET!
    : process.env.CLERK_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  // ヘッダーの取得
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // ヘッダーが不足していないかチェック
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // ボディの取得
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Webhookインスタンスの作成
  const wh = new Webhook(WEBHOOK_SECRET);

  let event: WebhookEvent;

  // 署名の検証 (ここが失敗するとエラーが投げられる)
  try {
    event = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new NextResponse("Error occured", {
      status: 400,
    });
  }

  // イベントタイプごとの処理
  const eventType = event.type;

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, username } = event.data;

    // DB同期を実行
    try {
      await upsertUser({
        id,
        username,
      });
      console.log(`User ${id} upserted via webhook`);
    } catch (error) {
      console.error("Database upsert failed:", error);
      return new NextResponse("Database error", { status: 500 });
    }
  }

  return new NextResponse("", { status: 200 });
}
