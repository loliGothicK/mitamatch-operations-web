"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TreeItem } from "@mui/x-tree-view";
import { getTimelinesAction, updateTimelineTitleAction, deleteTimelinesAction } from "@/_actions/timelines";
import { Folder } from "@mui/icons-material";
import { Menu, MenuItem, Modal, Stack, TextField, Typography } from "@mui/material";
import { useAtom } from "jotai";
import { timelineAtom, timelineTitleAtom } from "@/jotai/orderAtoms";
import { useState, MouseEvent } from "react";
import { ULID } from "ulid";

export function Timelines() {
  const [, setTimeline] = useAtom(timelineAtom);
  const [, setTitle] = useAtom(timelineTitleAtom);
  const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number; short: string; title: string } | null>(null);
  const [openRenameMenu, setOpenRenameMenu] = useState<{ short: string; title: string } | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const handleContextMenu = (e: MouseEvent, short: string, title: string) => {
    if (!short) return; // if short is not available for some reason
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
    queryKey: ["timelines"],
    queryFn: getTimelinesAction,
  });

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (rename: { short: ULID; title: string }) => updateTimelineTitleAction(rename),
    onSuccess: async () => {
      // Invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: ["timelines"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (short: ULID) => deleteTimelinesAction({ short }),
    onMutate: async (short) => {
      await queryClient.cancelQueries({ queryKey: ["timelines"] });
      const previousTimelines = queryClient.getQueryData(["timelines"]);
      queryClient.setQueryData(["timelines"], (old: any) => old?.filter((t: any) => t.short !== short));
      return { previousTimelines };
    },
    onError: (_err, _short, context) => {
      queryClient.setQueryData(["timelines"], context?.previousTimelines);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["timelines"] });
    },
  });

  const handleDelete = (e: MouseEvent) => {
    e.stopPropagation();
    if (contextMenu) {
      deleteMutation.mutate(contextMenu.short);
    }
    handleCloseMenu();
  };

  const label = (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
      <Folder />
      <Typography>Timelines</Typography>
    </Stack>
  );

  return (
    <TreeItem itemId="timelines" label={label} disabled={query.data === undefined}>
      {query.data?.map((timeline, index) => {
        const itemId = timeline.short || `timeline-${index}`;
        return (
          <TreeItem
            key={itemId}
            itemId={itemId}
            label={timeline.title}
            onContextMenu={(e) => {
              if (timeline.short) {
                handleContextMenu(e, timeline.short, timeline.title);
              }
            }}
            onDoubleClick={() => {
              setTimeline(timeline.timeline);
              setTitle(timeline.title);
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
            Rename Timeline
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
