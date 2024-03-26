import { memoriaList } from '@/domain/memoria/memoria';
import { orderList } from '@/domain/order/order';
import { MemoriaWithConcentration } from '@/jotai/memoriaAtoms';
import { OrderWithPIC } from '@/jotai/orderAtoms';

export function encodeDeck(
  sw: 'sword' | 'shield',
  deck: MemoriaWithConcentration[],
  legendaryDeck: MemoriaWithConcentration[],
) {
  const deckInfo = deck.map((memoria) => [memoria.id, memoria.concentration]);
  const legendaryDeckInfo = legendaryDeck.map((memoria) => [
    memoria.id,
    memoria.concentration,
  ]);
  return btoa(
    JSON.stringify({
      sw,
      deck: deckInfo,
      legendaryDeck: legendaryDeckInfo,
    }),
  );
}

export function decodeDeck(encoded: string): {
  sw: 'sword' | 'shield';
  deck: MemoriaWithConcentration[];
  legendaryDeck: MemoriaWithConcentration[];
} {
  const { sw, deck, legendaryDeck } = JSON.parse(atob(encoded));
  const deckMap = new Map(memoriaList.map((memoria) => [memoria.id, memoria]));
  return {
    sw,
    legendaryDeck: legendaryDeck.map(
      ([id, concentration]: [number, number]) => {
        return { ...deckMap.get(id), concentration: concentration ?? 4 };
      },
    ),
    deck: deck.map(([id, concentration]: [number, number]) => {
      return { ...deckMap.get(id), concentration: concentration ?? 4 };
    }),
  };
}

export function encodeTimeline(timeline: OrderWithPIC[]) {
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

export function decodeTimeline(encoded: string): OrderWithPIC[] {
  const orderMap = new Map(orderList.map((order) => [order.id, order]));
  const { timeline } = JSON.parse(atob(encoded));

  return timeline.map(
    (item: { id: number; delay?: number; pic?: string; sub?: string }) => {
      return {
        ...orderMap.get(item.id)!,
        delay: item.delay,
        pic: item.pic ? decodeURIComponent(item.pic) : undefined,
        sub: item.sub ? decodeURIComponent(item.sub) : undefined,
      };
    },
  );
}
