import { useAtom } from "jotai";
import { useSearchParams } from "next/navigation";
import { useRef } from "react";
import { useAsync } from "react-use";
import { restore } from "@/actions/restore";
import { shouldResetDeckBuilderQueryForSw, getDefaultDeckBuilderQuery } from "@/domain/memoria/query";
import {
  rwDeckAtom,
  rwLegendaryDeckAtom,
  swAtom,
  compareModeAtom,
  deckBuilderQueryAtom,
  unitTitleAtom,
} from "@/jotai/memoriaAtoms";

export function useDeckRestore() {
  const params = useSearchParams();
  const [, setTitle] = useAtom(unitTitleAtom);
  const [, setDeck] = useAtom(rwDeckAtom);
  const [, setLegendaryDeck] = useAtom(rwLegendaryDeckAtom);
  const [, setSw] = useAtom(swAtom);
  const [, setCompare] = useAtom(compareModeAtom);
  const [query, setQuery] = useAtom(deckBuilderQueryAtom);

  const loadedDeck = useRef<string | null>(null);

  useAsync(async () => {
    const value = params.get("deck");
    const title = params.get("title");

    if (value === loadedDeck.current) return;
    loadedDeck.current = value;

    setTitle(title ? decodeURI(title) : "No Title");
    if (value) {
      const { sw, deck, legendaryDeck } = await restore({
        target: "deck",
        param: value,
      });
      setSw(sw);
      if (shouldResetDeckBuilderQueryForSw(query, sw)) {
        setQuery(getDefaultDeckBuilderQuery(sw));
      }
      setDeck(deck);
      setLegendaryDeck(legendaryDeck);
      setCompare(undefined);
    }
  }, [params, query, setCompare, setDeck, setLegendaryDeck, setQuery, setSw, setTitle]);
}
