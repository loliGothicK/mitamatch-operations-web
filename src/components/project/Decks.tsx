"use client";

import { useQuery } from "@tanstack/react-query";
import { TreeItem } from "@mui/x-tree-view";
import { getDecksAction } from "@/_actions/decks";
import { Folder } from "@mui/icons-material";
import { Stack, Typography } from "@mui/material";

export function Decks() {
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
    <TreeItem itemId="decks" label={label} disabled={Boolean(query.data)}>
      {query.data?.map((deck, index) => {
        return <TreeItem key={deck.title} itemId={`${index}`} label={deck.title} />;
      })}
    </TreeItem>
  );
}
