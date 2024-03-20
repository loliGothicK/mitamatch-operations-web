import { atom } from "jotai";
import { data } from "@/public/memoria.json";
import {
  elementFilter,
  elementFilterMap,
  ElementFilterType,
  roleFilterMap,
  RoleFilterType,
} from "@/type/FilterType";
import { match } from "ts-pattern";
import {
  AssistSupportSearch,
  BasicStatusSearch,
  ElementStatusSearch,
  LabelSearch,
  RecoverySupportSearch,
  VanguardSupportSearch,
} from "@/type/SearchType";
import { parse_skill } from "@/utils/parser/skill";
import { parse_support } from "@/utils/parser/support";
import {
  AssistSupportCheckbox,
  RecoverySupportCheckbox,
} from "@/component/Search";

export type Memoria = (typeof data)[0];
export type MemoriaWithConcentration = Memoria & { concentration?: number };

export const sortKind = [
  "ID",
  "NAME",
  "ATK",
  "Sp.ATK",
  "DEF",
  "Sp.DEF",
  "ATK+Sp.ATK",
  "DEF+Sp.DEF",
] as const;
export type SortKind = (typeof sortKind)[number];

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
export const elementStatusFilterAtom = atom<ElementStatusSearch[]>([]);
export const vanguardSupportFilterAtom = atom<VanguardSupportSearch[]>([]);
export const assistSupportFilterAtom = atom<AssistSupportSearch[]>([]);
export const recoverySupportFilterAtom = atom<RecoverySupportSearch[]>([]);
export const sortKindAtom = atom<SortKind>("ID");

export const filteredMemoriaAtom = atom((get) => {
  return get(memoriaAtom)
    .filter((memoria) => {
      const sw = match(get(swAtom))
        .with("shield", () => ["支援", "妨害", "回復"].includes(memoria.kind))
        .with("sword", () =>
          ["通常単体", "通常範囲", "特殊単体", "特殊範囲"].includes(
            memoria.kind,
          ),
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
        return skill.status.some((x) => {
          return x === filter.status && skill.upDown === filter.upDown;
        });
      });

      const elementStatus = get(elementStatusFilterAtom).every((filter) => {
        return skill.status.some((x) => {
          return x === filter.status && skill.upDown === filter.upDown;
        });
      });

      const support = parse_support(
        memoria.support.name,
        memoria.support.description,
      );

      const vanguardSupport = get(vanguardSupportFilterAtom).every((filter) => {
        if (typeof filter === "string") {
          return support.kind.some(
            (x) => typeof x === "string" && x === filter,
          );
        } else {
          return support.kind.some((x) => {
            return (
              typeof x !== "string" &&
              x.status === filter.status &&
              x.upDown === filter.upDown
            );
          });
        }
      });

      const assistSupport = get(assistSupportFilterAtom).every((filter) => {
        if (typeof filter === "string") {
          return support.kind.some(
            (x) => typeof x === "string" && x === filter,
          );
        } else {
          return support.kind.some((x) => {
            return (
              typeof x !== "string" &&
              x.status === filter.status &&
              x.upDown === filter.upDown
            );
          });
        }
      });

      const recoverySupport = get(recoverySupportFilterAtom).every((filter) => {
        if (typeof filter === "string") {
          return support.kind.some(
            (x) => typeof x === "string" && x === filter,
          );
        } else {
          return support.kind.some((x) => {
            return (
              typeof x !== "string" &&
              x.status === filter.status &&
              x.upDown === filter.upDown
            );
          });
        }
      });

      return (
        sw &&
        role &&
        element &&
        label &&
        basicStatus &&
        elementStatus &&
        vanguardSupport &&
        assistSupport &&
        recoverySupport &&
        !get(deckAtom).some(({ name }) => memoria.name === name) &&
        !get(legendaryDeckAtom).some(({ name }) => memoria.name === name)
      );
    })
    .sort((a, b) => {
      const kind = match(get(sortKindAtom))
        .with("ID", () => b.id - a.id)
        .with("NAME", () => a.name.localeCompare(b.name))
        .with("ATK", () => b.status[4][0] - a.status[4][0])
        .with("Sp.ATK", () => b.status[4][1] - a.status[4][1])
        .with("DEF", () => b.status[4][2] - b.status[4][1])
        .with("Sp.DEF", () => b.status[4][3] - b.status[4][3])
        .with(
          "ATK+Sp.ATK",
          () =>
            b.status[4][0] + b.status[4][1] - (a.status[4][0] + a.status[4][1]),
        )
        .with(
          "DEF+Sp.DEF",
          () =>
            b.status[4][2] + b.status[4][3] - (a.status[4][2] + a.status[4][3]),
        )
        .exhaustive();
      return kind;
    });
});
