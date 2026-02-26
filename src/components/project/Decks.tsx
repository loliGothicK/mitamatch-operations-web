"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TreeItem } from "@mui/x-tree-view";
import { getDecksAction, updateTitleAction } from "@/_actions/decks";
import { Folder } from "@mui/icons-material";
import { Menu, MenuItem, Modal, Stack, TextField, Typography } from "@mui/material";
import { useAtom } from "jotai";
import { rwDeckAtom, rwLegendaryDeckAtom } from "@/jotai/memoriaAtoms";
import { openAtom } from "@/jotai/editor";
import { useState, MouseEvent } from "react";
import { Box } from "@mui/system";
import { ULID } from "ulid";

export function Decks() {
  const [, setLegendaryDeck] = useAtom(rwLegendaryDeckAtom);
  const [, setDeck] = useAtom(rwDeckAtom);
  const [, setOpen] = useAtom(openAtom);
  const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number } | null>(null);
  const [openRenameMenu, setOpenRenameMenu] = useState(false);
  const [newTitle, setNewTitle] = useState("new title");

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      mouseX: e.clientX + 2,
      mouseY: e.clientY - 6,
    });
  };

  const handleRenameStart = (e: MouseEvent) => {
    e.stopPropagation();
    setOpenRenameMenu(true);
    handleCloseMenu();
  };

  const handleCloseMenu = () => {
    setContextMenu(null);
  };

  // Queries
  const query = useQuery({
    queryKey: ["decks"],
    queryFn: getDecksAction,
  });

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (rename: { short: ULID; title: string }) => updateTitleAction(rename),
    onSuccess: async () => {
      // Invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: ["decks"] });
    },
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
        return (
          <Box key={deck.short}>
            <Modal open={openRenameMenu} onClose={() => setOpenRenameMenu(false)}>
              <Stack
                direction="column"
                alignItems="center"
                justifyContent="center"
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  bgcolor: "background.paper",
                }}
              >
                <Typography variant="h6" component="h2">
                  Rename Deck
                </Typography>
                <TextField
                  id="outlined-basic"
                  label="new title"
                  variant="outlined"
                  onChange={(e) => setNewTitle(e.target.value)}
                />
                <Stack direction="row" spacing={2} mt={2}>
                  <button
                    onClick={() => {
                      setOpenRenameMenu(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      mutation.mutate({ short: deck.short, title: newTitle });
                      setOpenRenameMenu(false);
                    }}
                  >
                    Save
                  </button>
                </Stack>
              </Stack>
            </Modal>
            <TreeItem
              itemId={deck.short}
              label={deck.title}
              onContextMenu={handleContextMenu}
              onDoubleClick={() => {
                setOpen({
                  type: "deck",
                  hash: deck.short,
                });
                setLegendaryDeck(deck.unit.legendaryDeck);
                setDeck(deck.unit.deck);
              }}
            />
            <Menu
              open={contextMenu !== null}
              onClose={handleCloseMenu}
              anchorReference="anchorPosition"
              anchorPosition={
                contextMenu !== null
                  ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                  : undefined
              }
            >
              <MenuItem onClick={handleRenameStart}>Rename</MenuItem>
              <MenuItem onClick={handleCloseMenu}>Delete</MenuItem>
            </Menu>
          </Box>
        );
      })}
    </TreeItem>
  );
}
