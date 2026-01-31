"use client";

import { useQuery } from "@tanstack/react-query";
import { TreeItem } from "@mui/x-tree-view";
import { getDecksAction } from "@/_actions/decks";
import { Folder } from "@mui/icons-material";
import { Stack, Typography } from "@mui/material";
import {useAtom} from "jotai";
import {rwDeckAtom, rwLegendaryDeckAtom} from "@/jotai/memoriaAtoms";

export function Decks() {
  const [, setLegendaryDeck] = useAtom(rwLegendaryDeckAtom);
  const [, setDeck] = useAtom(rwDeckAtom);
  // Queries
  const query = useQuery({
    queryKey: ["decks"],
    queryFn: getDecksAction,
  });

  const label = (
    <Stack direction="row" spacing={1} alignItems="center">
      <Folder />
      <Typography>Decks</Typography>
    </Stack>
  );

  return (
    <TreeItem itemId="decks" label={label} disabled={query.data === undefined}>
      {query.data?.map((deck) => {
        return <TreeItem
          key={deck.short}
          itemId={deck.short}
          label={deck.title}
          onContextMenu={(e) => e.preventDefault()}
          onDoubleClick={() => {
            setLegendaryDeck(deck.unit.legendaryDeck);
            setDeck(deck.unit.deck);
          }}
        />;
      })}
    </TreeItem>
  );
}
