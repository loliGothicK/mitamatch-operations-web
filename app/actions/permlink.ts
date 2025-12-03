"use server";
import crypto from "node:crypto";
import { upsertDeck, upsertTimeline } from "@/database";

export async function generateShortLink(data: { full: string }) {
  return await (async () => crypto.createHash("md5").update(data.full).digest("hex"))();
}

export async function saveShortLink({
  target,
  full,
  short,
}: {
  target: "deck" | "timeline";
  full: string;
  short: string;
}) {
  "use server";
  if (target === "deck") {
    await upsertDeck({
      short,
      full,
    });
  } else {
    await upsertTimeline({
      short,
      full,
    });
  }
}
