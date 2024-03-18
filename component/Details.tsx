"use client";
import { useAtom } from "jotai";
import { deckAtom, legendaryDeckAtom, Memoria } from "@/jotai/atom";
import { Lens } from "monocle-ts";
import {
  parse_skill,
  StatusKind,
  statusKind,
  statusKindMap,
} from "@/utils/parser/skill";
import Grid from "@mui/material/Grid";
import { Button } from "@mui/material";

export default function Details() {
  const [deck] = useAtom(deckAtom);
  const [legendaryDeck] = useAtom(legendaryDeckAtom);

  const skillName = Lens.fromPath<Memoria>()(["skill", "name"]);
  const skillDescription = Lens.fromPath<Memoria>()(["skill", "description"]);

  const skills = [...deck, ...legendaryDeck].map((memoria) => {
    return parse_skill(skillName.get(memoria), skillDescription.get(memoria));
  });

  const aggregate = new Map(
    statusKind.map((kind) => {
      const up = skills.filter(
        ({ status, upDown }) => upDown === "up" && status.includes(kind),
      ).length;
      const down = skills.filter(
        ({ status, upDown }) => upDown === "down" && status.includes(kind),
      ).length;
      return [kind, { up, down }];
    }),
  );

  return (
    <Grid container spacing={1}>
      {statusKind.map((kind) => {
        if (!aggregate.has(kind)) {
          return <></>;
        } else {
          const { up, down } = aggregate.get(kind)!;
          const upCount =
            up > 0 ? (
              <Grid item xs={4} key={kind}>
                <Button>
                  {statusKindMap[kind]} UP: {up}
                </Button>
              </Grid>
            ) : (
              <></>
            );
          const downCount =
            down > 0 ? (
              <Grid item xs={4} key={kind}>
                <Button>
                  {statusKindMap[kind]} DOWN: {down}
                </Button>
              </Grid>
            ) : (
              <></>
            );
          return (
            <>
              {upCount}
              {downCount}
            </>
          );
        }
      })}
    </Grid>
  );
}
