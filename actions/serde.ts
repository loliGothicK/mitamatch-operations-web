import { MemoriaWithConcentration } from '@/jotai/atoms';
import { data } from '@/public/memoria.json';

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
  const deckMap = new Map(data.map((memoria) => [memoria.id, memoria]));
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
