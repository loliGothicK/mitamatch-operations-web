"use client";

import { useAtom } from "jotai";

import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

import { rwDeckAtom, rwLegendaryDeckAtom } from "@/jotai/memoriaAtoms";
import { isBuffEffect, isDebuffEffect, isStackEffect, stackKinds } from "@/parser/skill";
import type { SupportKind } from "@/parser/autoSkill";
import { elementFilter } from "@/types/filterType";

import { match } from "ts-pattern";
import { StatusKind } from "@/evaluate/types";
import { statusKind } from "@/evaluate/constants";

type UpDown = "UP" | "DOWN";
type StatusPattern = `${StatusKind}/${UpDown}`;
const statusPattern: StatusPattern[] = statusKind.flatMap((s) => {
  return [`${s}/UP`, `${s}/DOWN`] as StatusPattern[];
});
export const elementFilterMap = {
  Fire: "火",
  Water: "水",
  Wind: "風",
  Light: "光",
  Dark: "闇",
};

export function intoStatusPattern({
  status,
  upDown,
}: {
  status: StatusKind;
  upDown: UpDown;
}): StatusPattern {
  return `${status}/${upDown}` as StatusPattern;
}

export function statusPatternToJapanese(pattern: StatusPattern): string {
  const [status, upDown] = pattern.split("/") as [StatusKind, UpDown];
  return match(status)
    .with("ATK", () => `攻${upDown}`)
    .with("DEF", () => `防${upDown}`)
    .with("Sp.ATK", () => `特攻${upDown}`)
    .with("Sp.DEF", () => `特防${upDown}`)
    .with("Life", () => `HP${upDown}`)
    .with("Fire ATK", () => `火攻${upDown}`)
    .with("Fire DEF", () => `火防${upDown}`)
    .with("Water ATK", () => `水攻${upDown}`)
    .with("Water DEF", () => `水防${upDown}`)
    .with("Wind ATK", () => `風攻${upDown}`)
    .with("Wind DEF", () => `風防${upDown}`)
    .with("Light ATK", () => `光攻${upDown}`)
    .with("Light DEF", () => `光防${upDown}`)
    .with("Dark ATK", () => `闇攻${upDown}`)
    .with("Dark DEF", () => `闇防${upDown}`)
    .exhaustive();
}

export function stackPatternToJapanese(pattern: (typeof stackKinds)[number]): string {
  return match(pattern)
    .with("eden", () => "エデン")
    .with("barrier", () => "バリア")
    .with("anima", () => "アニマ")
    .with("meteor", () => "メテオ")
    .exhaustive();
}

type SupportPattern =
  | `${Exclude<StatusKind, "Life" | "Light ATK" | "Light DEF" | "Dark ATK" | "Dark DEF">}/${UpDown}`
  | "DamageUp"
  | "SupportUp"
  | "RecoveryUp"
  | "MatchPtUp"
  | "MpCostDown"
  | "RangeUp";
const supportPattern: SupportPattern[] = [
  "DamageUp",
  "SupportUp",
  "RecoveryUp",
  "MatchPtUp",
  "MpCostDown",
  "RangeUp",
  ...[
    "ATK",
    "DEF",
    "Sp.ATK",
    "Sp.DEF",
    "Fire ATK",
    "Fire DEF",
    "Water ATK",
    "Water DEF",
    "Wind ATK",
    "Wind DEF",
  ].flatMap((s) => {
    return [`${s}/UP`, `${s}/DOWN`] as SupportPattern[];
  }),
] as const;

export function supportPatternToJapanese(pattern: SupportPattern): string {
  return match(pattern)
    .with("ATK/UP", () => "攻UP")
    .with("DEF/UP", () => "防UP")
    .with("Sp.ATK/UP", () => "特攻UP")
    .with("Sp.DEF/UP", () => "特防UP")
    .with("ATK/DOWN", () => "攻DOWN")
    .with("DEF/DOWN", () => "防DOWN")
    .with("Sp.ATK/DOWN", () => "特攻DOWN")
    .with("Sp.DEF/DOWN", () => "特防DOWN")
    .with("Fire ATK/UP", () => "火攻UP")
    .with("Fire DEF/UP", () => "火防UP")
    .with("Water ATK/UP", () => "水攻UP")
    .with("Water DEF/UP", () => "水防UP")
    .with("Wind ATK/UP", () => "風攻UP")
    .with("Wind DEF/UP", () => "風防UP")
    .with("Fire ATK/DOWN", () => "火攻DOWN")
    .with("Fire DEF/DOWN", () => "火防DOWN")
    .with("Water ATK/DOWN", () => "水攻DOWN")
    .with("Water DEF/DOWN", () => "水防DOWN")
    .with("Wind ATK/DOWN", () => "風攻DOWN")
    .with("Wind DEF/DOWN", () => "風防DOWN")
    .with("DamageUp", () => "ダメージUP")
    .with("SupportUp", () => "支援UP")
    .with("RecoveryUp", () => "回復UP")
    .with("MatchPtUp", () => "PtUP")
    .with("MpCostDown", () => "MP")
    .with("RangeUp", () => "範囲+1")
    .exhaustive();
}

export function intoSupportPattern(kind: SupportKind): SupportPattern {
  return match(kind.type)
    .with("DamageUp", () => "DamageUp")
    .with("SupportUp", () => "SupportUp")
    .with("RecoveryUp", () => "RecoveryUp")
    .with("MatchPtUp", () => "MatchPtUp")
    .with("MpCostDown", () => "MpCostDown")
    .with("RangeUp", () => "RangeUp")
    .with("UP", () => intoStatusPattern({ status: kind.status!, upDown: "UP" }))
    .with("DOWN", () => intoStatusPattern({ status: kind.status!, upDown: "DOWN" }))
    .exhaustive() as SupportPattern;
}

export default function Details() {
  const [deck] = useAtom(rwDeckAtom);
  const [legendaryDeck] = useAtom(rwLegendaryDeckAtom);

  const skills = deck.concat(legendaryDeck).map((memoria) => memoria.skills.gvgSkill);

  const skillAggregate = new Map<StatusPattern, number>();
  for (const pattern of skills.flatMap((skill) => {
    return skill.effects
      .filter((eff) => isBuffEffect(eff) || isDebuffEffect(eff))
      .map((eff) => {
        return intoStatusPattern({
          status: eff.status,
          upDown: eff.type === "buff" ? "UP" : "DOWN",
        });
      });
  })) {
    skillAggregate.set(pattern, (skillAggregate.get(pattern) || 0) + 1);
  }

  const supports = [...deck, ...legendaryDeck].map((memoria) => memoria.skills.autoSkill);

  const supportAggregate = new Map<SupportPattern, number>();
  for (const pattern of supports.flatMap((support) => {
    return support.effects.map((eff) => {
      return intoSupportPattern(eff);
    });
  })) {
    supportAggregate.set(pattern, (supportAggregate.get(pattern) || 0) + 1);
  }

  const elementAggregate = new Map<string, number>();
  for (const element of [...deck, ...legendaryDeck].map((memoria) => {
    return memoria.attribute;
  })) {
    elementAggregate.set(element, (elementAggregate.get(element) || 0) + 1);
  }

  const kindAggregate = new Map<string, number>();
  for (const kind of [...deck, ...legendaryDeck].map((memoria) => {
    return memoria.cardType;
  })) {
    kindAggregate.set(kind, (kindAggregate.get(kind) || 0) + 1);
  }

  const stackAggregate = new Map<(typeof stackKinds)[number], number>();
  for (const pattern of skills.flatMap((skill) => skill.effects.filter(isStackEffect()))) {
    const { kind, times } = pattern;
    stackAggregate.set(kind, (stackAggregate.get(kind) || 0) + times);
  }

  return (
    <Grid container spacing={1} alignItems={"left"} direction={"column"} sx={{ marginTop: 5 }}>
      <Typography variant="body1">スキル</Typography>
      <Divider />
      <Grid container>
        {skillAggregate.size !== 0 &&
          statusPattern
            .filter((pattern) => skillAggregate.get(pattern) !== undefined)
            .map((pattern) => {
              return (
                <Grid size={{ xs: 4 }} key={pattern}>
                  <Typography fontSize={10}>
                    {statusPatternToJapanese(pattern)} : {skillAggregate.get(pattern)}
                  </Typography>
                </Grid>
              );
            })}
      </Grid>
      <Typography variant="body1" marginTop={2}>
        スタック
      </Typography>
      <Divider />
      <Grid container spacing={1}>
        {supportAggregate.size !== 0 &&
          stackKinds
            .filter((pattern) => stackAggregate.get(pattern) !== undefined)
            .map((pattern) => {
              return (
                <Grid size={{ xs: 4 }} key={pattern}>
                  <Typography fontSize={10}>
                    {stackPatternToJapanese(pattern)} : {stackAggregate.get(pattern)}
                  </Typography>
                </Grid>
              );
            })}
      </Grid>

      <Typography variant="body1" marginTop={2}>
        補助スキル
      </Typography>
      <Divider />
      <Grid container spacing={1}>
        {supportAggregate.size !== 0 &&
          supportPattern
            .filter((pattern) => supportAggregate.get(pattern) !== undefined)
            .map((pattern) => {
              return (
                <Grid size={{ xs: 4 }} key={pattern}>
                  <Typography fontSize={10}>
                    {supportPatternToJapanese(pattern)} : {supportAggregate.get(pattern)}
                  </Typography>
                </Grid>
              );
            })}
      </Grid>
      <Typography variant="body1" marginTop={2}>
        属性
      </Typography>
      <Divider />
      <Grid container spacing={1}>
        {elementAggregate.size !== 0 &&
          elementFilter
            .map((kind) => elementFilterMap[kind])
            .filter((kind) => elementAggregate.get(kind) !== undefined)
            .map((kind) => {
              return (
                <Grid size={{ xs: 4 }} key={kind}>
                  <Typography fontSize={10}>
                    {kind} : {elementAggregate.get(kind)}
                  </Typography>
                </Grid>
              );
            })}
      </Grid>
      <Typography variant="body1" marginTop={2}>
        内訳
      </Typography>
      <Divider />
      <Grid container spacing={1}>
        {kindAggregate.size !== 0 &&
          ["通常単体", "通常範囲", "特殊単体", "特殊範囲", "支援", "妨害", "回復"]
            .filter((kind) => kindAggregate.get(kind) !== undefined)
            .map((kind) => {
              return (
                <Grid size={{ xs: 4 }} key={kind}>
                  <Typography fontSize={10}>
                    {kind} : {kindAggregate.get(kind)}
                  </Typography>
                </Grid>
              );
            })}
      </Grid>
    </Grid>
  );
}
