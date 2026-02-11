"use client";

import { useQuery } from "@tanstack/react-query";
import { TreeItem } from "@mui/x-tree-view";
import { getTimelinesAction } from "@/_actions/timelines";
import { Folder } from "@mui/icons-material";
import { Stack, Typography } from "@mui/material";
import { useAtom } from "jotai";
import { timelineAtom } from "@/jotai/orderAtoms";

export function Timelines() {
  const [, setTimeline] = useAtom(timelineAtom);
  // Queries
  const query = useQuery({
    queryKey: ["timelines"],
    queryFn: getTimelinesAction,
  });

  const label = (
    <Stack direction="row" spacing={1} alignItems="center">
      <Folder />
      <Typography>Timelines</Typography>
    </Stack>
  );

  return (
    <TreeItem itemId="timelines" label={label} disabled={query.data === undefined}>
      {query.data?.map((timeline, index) => {
        return (
          <TreeItem
            key={timeline.title}
            itemId={`${index}`}
            label={timeline.title}
            onContextMenu={(e) => e.preventDefault()}
            onDoubleClick={() => {
              setTimeline(timeline.timeline);
            }}
          />
        );
      })}
    </TreeItem>
  );
}
