import { MemoriaWithConcentration } from "@/jotai/atom";
import { data } from "@/public/memoria.json";

export function encodeDeck(
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
      deck: deckInfo,
      legendaryDeck: legendaryDeckInfo,
    }),
  );
}

export function decodeDeck(encoded: string): {
  deck: MemoriaWithConcentration[];
  legendaryDeck: MemoriaWithConcentration[];
} {
  const { deck, legendaryDeck } = JSON.parse(atob(encoded));
  const deckMap = new Map(data.map((memoria) => [memoria.id, memoria]));
  return {
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
