"use client";
import { useAtom } from "jotai";
import { deckAtom, legendaryDeckAtom, Memoria } from "@/jotai/atom";
import { Lens } from "monocle-ts";
import {
  parse_skill,
  statusKind,
  statusToJapanese,
} from "@/utils/parser/skill";
import { parse_support, toJapanese } from "@/utils/parser/support";
import Grid from "@mui/material/Grid";
import { Button } from "@mui/material";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";

export default function Details() {
  const [deck] = useAtom(deckAtom);
  const [legendaryDeck] = useAtom(legendaryDeckAtom);

  const skillName = Lens.fromPath<Memoria>()(["skill", "name"]);
  const skillDescription = Lens.fromPath<Memoria>()(["skill", "description"]);
  const supportName = Lens.fromPath<Memoria>()(["support", "name"]);
  const supportDescription = Lens.fromPath<Memoria>()([
    "support",
    "description",
  ]);

  const skills = [...deck, ...legendaryDeck].map((memoria) => {
    return parse_skill(skillName.get(memoria), skillDescription.get(memoria));
  });

  const skillAggregate = new Map<string, number>();
  for (const kind of skills.flatMap((skill) => {
    return skill.status.map((stat) => {
      return statusToJapanese({ status: stat, upDown: skill.upDown });
    });
  })) {
    skillAggregate.set(kind, (skillAggregate.get(kind) || 0) + 1);
  }

  const supports = [...deck, ...legendaryDeck].map((memoria) => {
    return parse_support(
      supportName.get(memoria),
      supportDescription.get(memoria),
    );
  });

  const supportAggregate = new Map<string, number>();
  for (const kind of supports.flatMap((support) => {
    return support.kind.map((kind) => {
      return toJapanese(kind);
    });
  })) {
    supportAggregate.set(kind, (supportAggregate.get(kind) || 0) + 1);
  }

  return (
    <>
      <Typography variant="body1">スキル</Typography>
      <Divider sx={{ margin: 2 }} />
      <Grid container spacing={1}>
        {skillAggregate.size == 0 ? (
          <></>
        ) : (
          [...skillAggregate.entries()].map(([kind, count]) => {
            return (
              <Grid item xs={4} key={kind}>
                <Button color={"info"}>
                  {kind} : {count}
                </Button>
              </Grid>
            );
          })
        )}
      </Grid>
      <Typography variant="body1">補助スキル</Typography>
      <Divider sx={{ margin: 2 }} />
      <Grid container spacing={1}>
        {supportAggregate.size == 0 ? (
          <></>
        ) : (
          [...supportAggregate.entries()].map(([kind, count]) => {
            return (
              <Grid item xs={4} key={kind}>
                <Button color={"info"}>
                  {kind} : {count}
                </Button>
              </Grid>
            );
          })
        )}
      </Grid>
    </>
  );
}
