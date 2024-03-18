"use client";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { decodeDeck } from "@/actions/encodeDeck";
import { deckAtom, legendaryDeckAtom } from "@/jotai/atom";
import { useAtom } from "jotai";
import { useEffect } from "react";
const DeckBuilder = dynamic(() => import("./_page"), { ssr: false });

export default function Page() {
  const params = useSearchParams();
  const [_, setDeck] = useAtom(deckAtom);
  const [__, setLegendaryDeck] = useAtom(legendaryDeckAtom);
  const value = params.get("deck");

  useEffect(() => {
    if (value) {
      const { deck, legendaryDeck } = decodeDeck(value);
      setDeck(deck);
      setLegendaryDeck(legendaryDeck);
    }
  }, [setDeck, setLegendaryDeck, value]);

  return <DeckBuilder />;
}
