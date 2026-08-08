"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TreeItem } from "@mui/x-tree-view";
import { getDecksAction, updateTitleAction, deleteDecksAction } from "@/_actions/decks";
import { Folder } from "@mui/icons-material";
import { Menu, MenuItem, Modal, Stack, TextField, Typography } from "@mui/material";
import { useAtom } from "jotai";
import { rwDeckAtom, rwLegendaryDeckAtom, unitTitleAtom } from "@/jotai/memoriaAtoms";
import { openAtom } from "@/jotai/editor";
import { useState, MouseEvent, useOptimistic, startTransition } from "react";
import { ULID } from "ulid";

export function Decks() {
  const [, setLegendaryDeck] = useAtom(rwLegendaryDeckAtom);
  const [, setDeck] = useAtom(rwDeckAtom);
  const [, setTitle] = useAtom(unitTitleAtom);
  const [, setOpen] = useAtom(openAtom);
  const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number; short: string; title: string } | null>(null);
  const [openRenameMenu, setOpenRenameMenu] = useState<{ short: string; title: string } | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const handleContextMenu = (e: MouseEvent, short: string, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      mouseX: e.clientX + 2,
      mouseY: e.clientY - 6,
      short,
      title,
    });
  };

  const handleRenameStart = (e: MouseEvent) => {
    e.stopPropagation();
    if (contextMenu) {
      setOpenRenameMenu({ short: contextMenu.short, title: contextMenu.title });
      setNewTitle(contextMenu.title);
    }
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

  const [optimisticDecks, removeOptimisticDeck] = useOptimistic(
    query.data || [],
    (state, shortToRemove: string) => state.filter((d) => d.short !== shortToRemove)
  );

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (rename: { short: ULID; title: string }) => updateTitleAction(rename),
    onSuccess: async () => {
      // Invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: ["decks"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (short: ULID) => deleteDecksAction({ short }),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["decks"] });
    },
  });

  const handleDelete = (e: MouseEvent) => {
    e.stopPropagation();
    if (contextMenu) {
      const short = contextMenu.short;
      startTransition(async () => {
        removeOptimisticDeck(short);
        await deleteMutation.mutateAsync(short);
      });
    }
    handleCloseMenu();
  };

  const label = (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
      <Folder />
      <Typography>Decks</Typography>
    </Stack>
  );

  return (
    <TreeItem itemId="decks" label={label} disabled={query.data === undefined}>
      {optimisticDecks.map((deck) => {
        return (
          <TreeItem
            key={deck.short}
            itemId={deck.short}
            label={deck.title}
            onContextMenu={(e) => handleContextMenu(e, deck.short, deck.title)}
            onDoubleClick={() => {
              setOpen({
                type: "deck",
                hash: deck.short,
              });
              setLegendaryDeck(deck.unit.legendaryDeck);
              setDeck(deck.unit.deck);
              setTitle(deck.title);
            }}
          />
        );
      })}

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
        <MenuItem onClick={handleDelete}>Delete</MenuItem>
      </Menu>

      <Modal open={openRenameMenu !== null} onClose={() => setOpenRenameMenu(null)}>
        <Stack
          onKeyDown={(e) => e.stopPropagation()}
          direction="column"
          spacing={2}
          sx={{
            alignItems: "center",
            justifyContent: "center",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "background.paper",
            p: 4,
            borderRadius: 2,
            boxShadow: 24,
          }}
        >
          <Typography variant="h6" component="h2">
            Rename Deck
          </Typography>
          <TextField
            id="outlined-basic"
            label="New Title"
            variant="outlined"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <button
              onClick={() => {
                setOpenRenameMenu(null);
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (openRenameMenu) {
                  mutation.mutate({ short: openRenameMenu.short, title: newTitle });
                }
                setOpenRenameMenu(null);
              }}
            >
              Save
            </button>
          </Stack>
        </Stack>
      </Modal>
    </TreeItem>
  );
}
