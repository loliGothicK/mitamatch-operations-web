"use server";
import { upsertDeck, upsertTimeline } from "@/database";

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
