import { atom } from "jotai";
import { data } from "@/public/memoria.json";
import {
  elementFilter,
  elementFilterMap,
  ElementFilterType,
  roleFilter,
  roleFilterMap,
  RoleFilterType,
} from "@/type/FilterType";
import { match } from "ts-pattern";
import { BasicStatusSearch, LabelSearch } from "@/type/SearchType";
import { parse_skill, SkillKind } from "@/utils/parser/skill";

export type Memoria = (typeof data)[0];
export type MemoriaWithConcentration = Memoria & { concentration?: number };

export const memoriaAtom = atom<Memoria[]>(() => data);
export const legendaryDeckAtom = atom<MemoriaWithConcentration[]>([]);
export const deckAtom = atom<MemoriaWithConcentration[]>([]);
export const swAtom = atom<"sword" | "shield">("shield");
export const roleFilterAtom = atom<RoleFilterType[]>([
  "support",
  "interference",
  "recovery",
]);
export const elementFilterAtom = atom<ElementFilterType[]>([...elementFilter]);
export const labelFilterAtom = atom<LabelSearch[]>([]);

export const currentRoleFilterAtom = atom((get) => {
  const sw = get(swAtom);
  return match<"sword" | "shield", RoleFilterType[]>(sw)
    .with("shield", () => ["support", "interference", "recovery"])
    .with("sword", () => [
      "normal_single",
      "normal_range",
      "special_single",
      "special_range",
    ])
    .exhaustive();
});

export const basicStatusFilterAtom = atom<BasicStatusSearch[]>([]);

export const filteredMemoriaAtom = atom((get) => {
  return get(memoriaAtom).filter((memoria) => {
    const sw = match(get(swAtom))
      .with("shield", () => ["支援", "妨害", "回復"].includes(memoria.kind))
      .with("sword", () =>
        ["通常単体", "通常範囲", "特殊単体", "特殊範囲"].includes(memoria.kind),
      )
      .exhaustive();

    const role = get(roleFilterAtom).some((filter) => {
      return memoria.kind === roleFilterMap[filter];
    });

    const element = get(elementFilterAtom).some((filter) => {
      return memoria.element === elementFilterMap[filter];
    });

    const label = get(labelFilterAtom).every((filter) => {
      return memoria.labels.includes(filter);
    });

    const skill = parse_skill(memoria.skill.name, memoria.skill.description);

    const basicStatus = get(basicStatusFilterAtom).every((filter) => {
      return match(filter)
        .with({ status: "ATK", upDown: skill.upDown }, () =>
          skill.status.includes("ATK"),
        )
        .with({ status: "DEF", upDown: skill.upDown }, () =>
          skill.status.includes("DEF"),
        )
        .with({ status: "Sp.ATK", upDown: skill.upDown }, () =>
          skill.status.includes("Sp.ATK"),
        )
        .with({ status: "Sp.DEF", upDown: skill.upDown }, () =>
          skill.status.includes("Sp.DEF"),
        )
        .with({ status: "Life", upDown: skill.upDown }, () =>
          skill.status.includes("Life"),
        )
        .otherwise(() => false);
    });

    return (
      sw &&
      role &&
      element &&
      label &&
      basicStatus &&
      !get(deckAtom).some(({ name }) => memoria.name === name) &&
      !get(legendaryDeckAtom).some(({ name }) => memoria.name === name)
    );
  });
});
