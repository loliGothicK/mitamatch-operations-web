"use server";
import type { Unit } from "@/domain/types";
import { match } from "ts-pattern";
import { decodeDeck, decodeTimeline } from "@/endec/serde";
import type { Order } from "@/domain/order/order";
import { getDeckFullUrl, getTimelineFullUrl } from "@/database";

type OrderWithPic = Order & {
  delay:
    | {
        source: "manual";
        value: number;
      }
    | {
        source: "auto";
        value?: number;
      };
  pic?: string;
  sub?: string;
};

export async function restore(_: { target: "deck"; param: string }): Promise<Unit>;
export async function restore(_: { target: "timeline"; param: string }): Promise<OrderWithPic[]>;
export async function restore({
  target,
  param,
}: {
  target: "deck" | "timeline";
  param: string;
}): Promise<Unit | OrderWithPic[]> {
  const parseResult = match(target)
    .with("deck", () => decodeDeck(param))
    .with("timeline", () => decodeTimeline(param))
    .exhaustive();

  if (parseResult.isOk()) {
    return parseResult.value;
  }
  const full = await match(target)
    .with("deck", async () => {
      return (await getDeckFullUrl(param)) || param;
    })
    .with("timeline", async () => {
      return (await getTimelineFullUrl(param)) || param;
    })
    .exhaustive();
  return match(target)
    .with("deck", () => decodeDeck(full)._unsafeUnwrap())
    .with("timeline", () => decodeTimeline(full)._unsafeUnwrap())
    .exhaustive();
}
