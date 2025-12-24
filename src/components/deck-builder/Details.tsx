"use client";

import { useAtom } from "jotai";

import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

import { rwDeckAtom, rwLegendaryDeckAtom } from "@/jotai/memoriaAtoms";
import {
  Attribute,
  ATTRIBUTES,
  elementEffectKinds,
  isBuffEffect,
  isDebuffEffect,
  isElementEffect,
  isStackEffect,
  MAJOR_ATTRIBUTES,
  MajorAttribute,
  stackKinds,
} from "@/parser/skill";
import type { SupportKind } from "@/parser/autoSkill";

import { match } from "ts-pattern";
import { StatusKind } from "@/evaluate/types";
import { statusKind } from "@/evaluate/constants";
import { formatCardType, Memoria } from "@/domain/memoria/memoria";
import { Chip } from "@mui/material";
import { Box } from "@mui/system";
import { useMemo } from "react";

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

export function attributePatternToJapanese(pattern: Attribute): string {
  return match(pattern)
    .with("Fire", () => "火")
    .with("Water", () => "水")
    .with("Wind", () => "風")
    .with("Light", () => "光")
    .with("Dark", () => "闇")
    .exhaustive();
}

export function elementPatternToJapanese(pattern: (typeof elementEffectKinds)[number]): string {
  return match(pattern)
    .with("minima", () => "ミニマ")
    .with("spread", () => "スプレッド")
    .with("enhance", () => "エンハンス")
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
  return match<typeof kind.type, SupportPattern>(kind.type)
    .with("DamageUp", () => "DamageUp")
    .with("SupportUp", () => "SupportUp")
    .with("RecoveryUp", () => "RecoveryUp")
    .with("MatchPtUp", () => "MatchPtUp")
    .with("MpCostDown", () => "MpCostDown")
    .with("RangeUp", () => "RangeUp")
    .with("UP", () => `${kind.status!}/UP`)
    .with("DOWN", () => `${kind.status!}/DOWN`)
    .exhaustive();
}

function DataChip({
  effect,
  count,
  attribute,
}: {
  readonly effect: string;
  readonly count: number;
  attribute?: MajorAttribute;
}) {
  const color =
    attribute &&
    match(attribute)
      .with("Fire", () => "error" as const)
      .with("Water", () => "info" as const)
      .with("Wind", () => "success" as const)
      .otherwise(() => "primary" as const);
  return <Chip label={`${effect}: ${count}`} size={"small"} color={color} />;
}

export default function Details() {
  const [deck] = useAtom(rwDeckAtom);
  const [legendaryDeck] = useAtom(rwLegendaryDeckAtom);

  const unit = useMemo(() => [...legendaryDeck, ...deck], [legendaryDeck, deck]);

  const skills = useMemo(
    () => deck.concat(legendaryDeck).map((memoria) => memoria.skills.gvgSkill),
    [deck, legendaryDeck],
  );

  const skillAggregate = useMemo(
    () =>
      skills
        .flatMap((skill) =>
          skill.effects
            .filter((eff) => isBuffEffect(eff) || isDebuffEffect(eff))
            .map((eff) =>
              intoStatusPattern({
                status: eff.status,
                upDown: eff.type === "buff" ? "UP" : "DOWN",
              }),
            ),
        )
        .reduce(
          (m, pattern) => m.set(pattern, (m.get(pattern) || 0) + 1),
          new Map<StatusPattern, number>(),
        ),
    [skills],
  );

  const supportAggregate = useMemo(
    () =>
      unit
        .map((memoria) => memoria.skills.autoSkill)
        .flatMap((support) =>
          support.effects.map((eff) => {
            return intoSupportPattern(eff);
          }),
        )
        .reduce(
          (m, pattern) => m.set(pattern, (m.get(pattern) || 0) + 1),
          new Map<SupportPattern, number>(),
        ),
    [unit],
  );

  const attributeAggregate = useMemo(
    () =>
      unit
        .flatMap((memoria) => memoria.attribute)
        .reduce(
          (m, pattern) => m.set(pattern, (m.get(pattern) || 0) + 1),
          new Map<Attribute, number>(),
        ),
    [unit],
  );

  const kindAggregate = useMemo(
    () =>
      unit.reduce(
        (m, memoria) => m.set(memoria.cardType, (m.get(memoria.cardType) || 0) + 1),
        new Map<Memoria["cardType"], number>(),
      ),
    [unit],
  );

  const stackAggregate = useMemo(
    () =>
      skills
        .flatMap((skill) => skill.effects.filter(isStackEffect()))
        .reduce(
          (m, { kind }) => m.set(kind, (m.get(kind) || 0) + 1),
          new Map<(typeof stackKinds)[number], number>(),
        ),
    [skills],
  );

  const elementAggregate = useMemo(
    () =>
      skills
        .flatMap((skill) => skill.effects.filter(isElementEffect()))
        .map(({ kind, element }) => ({ kind, element }))
        .reduce(
          (m, { kind, element }) => {
            m[element].set(kind, (m[element].get(kind) || 0) + 1);
            return m;
          },
          {
            Fire: new Map<(typeof elementEffectKinds)[number], number>(),
            Water: new Map<(typeof elementEffectKinds)[number], number>(),
            Wind: new Map<(typeof elementEffectKinds)[number], number>(),
          },
        ),
    [skills],
  );

  return (
    <Grid container spacing={1} alignItems={"left"} direction={"column"}>
      <Divider textAlign={"left"}>
        <Typography variant="body1">スキル</Typography>
      </Divider>
      <Box sx={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 1 }}>
        {skillAggregate.size !== 0 &&
          statusPattern
            .filter((pattern) => skillAggregate.get(pattern) !== undefined)
            .map((pattern) => {
              return (
                <DataChip
                  key={pattern}
                  effect={statusPatternToJapanese(pattern)}
                  count={skillAggregate.get(pattern)!}
                />
              );
            })}
      </Box>
      <Divider textAlign={"left"}>
        <Typography variant="body1">スタック</Typography>
      </Divider>
      <Box sx={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 1 }}>
        {stackAggregate.size !== 0 &&
          stackKinds
            .filter((pattern) => stackAggregate.get(pattern) !== undefined)
            .map((pattern) => {
              return (
                <DataChip
                  key={pattern}
                  effect={stackPatternToJapanese(pattern)}
                  count={stackAggregate.get(pattern)!}
                />
              );
            })}
      </Box>
      <Divider textAlign={"left"}>
        <Typography variant="body1">エレメント</Typography>
      </Divider>
      <Box sx={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 1 }}>
        {MAJOR_ATTRIBUTES.flatMap((attribute) =>
          elementEffectKinds
            .filter((kind) => elementAggregate[attribute].get(kind) !== undefined)
            .map((kind) => (
              <DataChip
                key={`${attribute}-${kind}`}
                effect={elementPatternToJapanese(kind)}
                count={elementAggregate[attribute].get(kind)!}
                attribute={attribute}
              />
            )),
        )}
      </Box>
      <Divider textAlign={"left"}>
        <Typography variant="body1">補助スキル</Typography>
      </Divider>
      <Box sx={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 1 }}>
        {supportAggregate.size !== 0 &&
          supportPattern
            .filter((pattern) => supportAggregate.get(pattern) !== undefined)
            .map((pattern) => {
              return (
                <DataChip
                  key={pattern}
                  effect={supportPatternToJapanese(pattern)}
                  count={supportAggregate.get(pattern)!}
                />
              );
            })}
      </Box>
      <Divider textAlign={"left"}>
        <Typography variant="body1">属性</Typography>
      </Divider>
      <Box sx={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 1 }}>
        {attributeAggregate.size !== 0 &&
          ATTRIBUTES.filter((pattern) => attributeAggregate.get(pattern) !== undefined).map(
            (pattern) => {
              return (
                <DataChip
                  key={pattern}
                  effect={attributePatternToJapanese(pattern)}
                  count={attributeAggregate.get(pattern)!}
                />
              );
            },
          )}
      </Box>
      <Divider textAlign={"left"}>
        <Typography variant="body1">カードタイプ</Typography>
      </Divider>
      <Grid container spacing={1}>
        {kindAggregate.size !== 0 &&
          ([1, 2, 3, 4, 5, 6, 7] as const)
            .filter((kind) => kindAggregate.get(kind) !== undefined)
            .map((kind) => {
              return (
                <DataChip
                  key={kind}
                  effect={formatCardType(kind)}
                  count={kindAggregate.get(kind)!}
                />
              );
            })}
      </Grid>
    </Grid>
  );
}
