"use server";
import { upsertDeck, upsertTimeline } from "@/database";
import { OrderWithPic } from "@/jotai/orderAtoms";
import { Unit } from "@/domain/types";

export async function saveShortLink(
  data:
    | {
        target: "deck";
        short: string;
        unit: Unit;
      }
    | {
        target: "timeline";
        short: string;
        timeline: OrderWithPic[];
      },
) {
  "use server";
  if (data.target === "deck") {
    await upsertDeck({
      short: data.short,
      unit: data.unit,
    });
  } else {
    await upsertTimeline({
      short: data.short,
      timeline: data.timeline,
    });
  }
}
