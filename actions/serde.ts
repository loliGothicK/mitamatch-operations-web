import { type Memoria, memoriaList } from '@/domain/memoria/memoria';
import { orderList, type Order } from '@/domain/order/order';
import type { MemoriaWithConcentration } from '@/jotai/memoriaAtoms';
import type { OrderWithPic } from '@/jotai/orderAtoms';
import type { Unit } from '@/domain/types';
import { type Result, fromThrowable, ok, err } from 'neverthrow';
import { z } from 'zod';
import { pipe } from 'fp-ts/function';
import { partition } from 'fp-ts/Array';
import { outdent } from 'outdent';

export function encodeDeck(
  sw: 'sword' | 'shield',
  deck: MemoriaWithConcentration[],
  legendaryDeck: MemoriaWithConcentration[],
) {
  const deckInfo = deck.map(memoria => [memoria.id, memoria.concentration]);
  const legendaryDeckInfo = legendaryDeck.map(
    memoria => [memoria.id, memoria.concentration] as const,
  );
  return btoa(
    JSON.stringify({
      sw,
      deck: deckInfo,
      legendaryDeck: legendaryDeckInfo,
    }),
  );
}

const Concentration = z.number().int().min(0).max(4);

const encodedUnit = z.object({
  sw: z.union([z.literal('sword'), z.literal('shield')]),
  deck: z.array(z.tuple([z.number(), Concentration])),
  legendaryDeck: z.array(z.tuple([z.number(), Concentration])),
});

type EncodedUnit = z.infer<typeof encodedUnit>;

const atobSafe = fromThrowable(
  atob,
  e => outdent`
    Error in \`atob\`:
    
    ${e}
  `,
);
const jsonParseSafe = fromThrowable(
  JSON.parse,
  e => outdent`
    Error in \`JSON.parse\`:

    ${e}
  `,
);
const unitParseSafe = fromThrowable(
  encodedUnit.parse,
  e => outdent`
    Error in \`JSON.parse\`:

    ${e}
  `,
);

const deckMap = new Map(memoriaList.map(memoria => [memoria.id, memoria]));

const restore = (
  data: [number, number][],
): Result<MemoriaWithConcentration[], number[]> => {
  const cov = data.map(([i, c]) => [deckMap.get(i), c, i] as const);
  const { left, right } = pipe(
    cov,
    partition(
      (item): item is [Memoria, number, number] => item[0] !== undefined,
    ),
  );
  return left.length > 0
    ? err(left.map(([, , id]) => id))
    : ok(
        right.map(([memoria, concentration]) => ({
          ...memoria,
          concentration: concentration as (0 | 1 | 2 | 3 | 4),
        })),
      );
};

export function decodeDeck(encoded: string): Result<Unit, string> {
  return atobSafe(encoded)
    .andThen(jsonParseSafe)
    .andThen(unitParseSafe)
    .andThen(
      ({ sw, deck, legendaryDeck }: EncodedUnit): Result<Unit, string> => {
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
          ...(restoreLegendaryDeckResult.isErr()
            ? restoreLegendaryDeckResult.error
            : []),
          ...(restoreDeckResult.isErr() ? restoreDeckResult.error : []),
        ];
        return err(`${notFound} are not found in memoria.json`);
      },
    );
}

export function encodeTimeline(timeline: OrderWithPic[]) {
  const timelineInfo = timeline.map(order => {
    return {
      id: order.id,
      delay: order.delay,
      pic: order.pic ? encodeURIComponent(order.pic) : undefined,
      sub: order.sub ? encodeURIComponent(order.sub) : undefined,
    };
  });
  return btoa(JSON.stringify({ timeline: timelineInfo }));
}

const timelineItemSchema = z.object({
  id: z.number(),
  delay: z.number().optional(),
  pic: z.string().optional(),
  sub: z.string().optional(),
});

const timelineSchema = z.array(timelineItemSchema);

type TimelineItem = z.infer<typeof timelineItemSchema>;
type Timeline = TimelineItem[];

const timelineParseSafe = fromThrowable(
  timelineSchema.parse,
  e => outdent`
    Error in \`timelineSchema.parse\`:

    ${e}
  `,
);

const orderMap = new Map(orderList.map(order => [order.id, order] as const));

const restoreTimeline = (data: Timeline): Result<OrderWithPic[], string> => {
  const cov = data.map(({ id, ...xs }) => {
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
        xs: Exclude<TimelineItem, 'order'>;
      } => item.order !== undefined,
    ),
  );
  return left.length > 0
    ? err(`${left.map(({ id }) => id)} are not found in order.json`)
    : ok(
        right.map(({ order, xs }) => ({
          ...order,
          ...xs,
        })),
      );
};

export function decodeTimeline(
  encoded: string,
): Result<OrderWithPic[], string> {
  return atobSafe(encoded)
    .andThen(jsonParseSafe)
    .andThen(timelineParseSafe)
    .andThen(restoreTimeline);
}
