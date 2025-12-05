import { type Memoria, memoriaList } from "@/domain/memoria/memoria";
import { orderList, type Order } from "@/domain/order/order";
import type { MemoriaWithConcentration } from "@/jotai/memoriaAtoms";
import type { OrderWithPic } from "@/jotai/orderAtoms";
import type { Unit } from "@/domain/types";
import { type Result, fromThrowable, ok, err } from "neverthrow";
import { z } from "zod";
import { identity, pipe } from "fp-ts/function";
import { partition } from "fp-ts/Array";
import { outdent } from "outdent";
import { match, P } from "ts-pattern";

export function encodeDeck(
  sw: "sword" | "shield",
  deck: MemoriaWithConcentration[],
  legendaryDeck: MemoriaWithConcentration[],
) {
  const deckInfo = deck.map((memoria) => [memoria.id, memoria.concentration]);
  const legendaryDeckInfo = legendaryDeck.map(
    (memoria) => [memoria.id, memoria.concentration] as const,
  );
  return btoa(
    JSON.stringify({
      sw,
      deck: deckInfo,
      legendaryDeck: legendaryDeckInfo,
    }),
  );
}

const Concentration = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);

const encodedUnit = z.object({
  sw: z.union([z.literal("sword"), z.literal("shield")]),
  deck: z.array(z.tuple([z.ulid(), Concentration])),
  legendaryDeck: z.array(z.tuple([z.ulid(), Concentration])),
});

type EncodedUnit = z.infer<typeof encodedUnit>;

const atobSafe = (data: string) =>
  fromThrowable(
    atob,
    (e) => outdent`
    Error in \`atob(${data})\`:
    
    ${e}
  `,
  )(data);

const jsonParseSafe = fromThrowable(
  JSON.parse,
  (e) => outdent`
    Error in \`JSON.parse\`:

    ${e}
  `,
);
const unitParseSafe = fromThrowable(
  encodedUnit.parse,
  (e) => outdent`
    Error in \`JSON.parse\`:

    ${e}
  `,
);

const deckMap = new Map(memoriaList.map((memoria) => [memoria.id, memoria]));

const restore = (data: [string, number][]): Result<MemoriaWithConcentration[], string[]> => {
  const cov = data.map(([i, c]) => [deckMap.get(i), c, i] as const);
  const { left, right } = pipe(
    cov,
    partition(
      (item): item is [Memoria, MemoriaWithConcentration["concentration"], string] =>
        item[0] !== undefined,
    ),
  );
  return left.length > 0
    ? err(left.map(([, , id]) => id))
    : ok(
        right.map(([memoria, concentration]) => ({
          ...memoria,
          concentration,
        })),
      );
};

export function decodeDeck(encoded: string): Result<Unit, string> {
  return atobSafe(encoded)
    .andThen(jsonParseSafe)
    .andThen(unitParseSafe)
    .andThen(({ sw, deck, legendaryDeck }: EncodedUnit): Result<Unit, string> => {
      const restoreLegendaryDeckResult = restore(legendaryDeck);
      const restoreDeckResult = restore(deck);
      if (restoreLegendaryDeckResult.isOk() && restoreDeckResult.isOk()) {
        return ok({
          sw,
          legendaryDeck: restoreLegendaryDeckResult.value,
          deck: restoreDeckResult.value,
        });
      }
      const notFound = [
        ...(restoreLegendaryDeckResult.isErr() ? restoreLegendaryDeckResult.error : []),
        ...(restoreDeckResult.isErr() ? restoreDeckResult.error : []),
      ];
      return err(`${notFound} are not found in memoria.json`);
    });
}

export function encodeTimeline(timeline: OrderWithPic[]) {
  const timelineInfo = timeline.map((order) => {
    return {
      id: order.id,
      delay: order.delay,
      pic: order.pic ? encodeURIComponent(order.pic) : undefined,
      sub: order.sub ? encodeURIComponent(order.sub) : undefined,
    };
  });
  return btoa(JSON.stringify({ timeline: timelineInfo }));
}

const timelineItemSchemaV1 = z.object({
  id: z.number(),
  delay: z.number().optional().nullable(),
  pic: z.string().optional().nullable(),
  sub: z.string().optional().nullable(),
});

const timelineItemSchemaV2 = z.object({
  id: z.number(),
  delay: z.union([
    z.object({
      source: z.literal("auto"),
      value: z.number().optional(),
    }),
    z.object({
      source: z.literal("manual"),
      value: z.number(),
    }),
  ]),
  pic: z.string().optional().nullable(),
  sub: z.string().optional().nullable(),
});

const timelineSchema = z.object({
  timeline: z.array(timelineItemSchemaV2),
});

const backwardsCompatibleSchema = z
  .object({
    timeline: z.union([z.array(timelineItemSchemaV1), z.array(timelineItemSchemaV2)]),
  })
  .transform((xs) => ({
    timeline: xs.timeline.map(
      ({ delay, ...xs }): z.infer<typeof timelineItemSchemaV2> => ({
        ...xs,
        delay: match(delay)
          .with(P.nullish, () => ({ source: "auto" as const }))
          .with(5, () => ({
            source: "auto" as const,
            value: 5,
          }))
          .with(P.number, (delay) => ({
            source: "manual" as const,
            value: delay,
          }))
          .otherwise(identity),
      }),
    ),
  }));

type TimelineItem = z.infer<typeof timelineItemSchemaV2>;
type Timeline = z.infer<typeof timelineSchema>;

const timelineParseSafe = fromThrowable(
  backwardsCompatibleSchema.parse,
  (e) => outdent`
    Error in \`backwardsCompatibleSchema.parse\`:

    ${e}
  `,
);

const orderMap = new Map(orderList.map((order) => [order.id, order] as const));

const restoreTimeline = (data: Timeline): Result<OrderWithPic[], string> => {
  const cov = data.timeline.map(({ id, ...xs }) => {
    return { id, order: orderMap.get(id), xs };
  });
  const { left, right } = pipe(
    cov,
    partition(
      (
        item,
      ): item is {
        id: number;
        order: Order;
        xs: Exclude<TimelineItem, "order">;
      } => item.order !== undefined,
    ),
  );
  return left.length > 0
    ? err(`${left.map(({ id }) => id)} are not found in order.json`)
    : ok(
        right.map(({ order, xs: { pic, sub, delay } }) => ({
          ...order,
          pic: pic ? decodeURIComponent(pic) : undefined,
          sub: sub ? decodeURIComponent(sub) : undefined,
          delay: delay || {
            source: "auto",
          },
        })),
      );
};

export function decodeTimeline(encoded: string): Result<OrderWithPic[], string> {
  return atobSafe(encoded)
    .andThen(jsonParseSafe)
    .andThen(timelineParseSafe)
    .andThen(restoreTimeline);
}
