import { atom, getDefaultStore } from "jotai";

import type { Memoria, MemoriaId } from "@/domain/memoria/memoria";
import { memoriaList } from "@/domain/memoria/memoria";
import {
  type ElementFilterType,
  type RoleFilterType,
  elementFilter,
  roleFilterMap,
} from "@/types/filterType";
import type {
  AssistSupportSearch,
  BasicStatusSearch,
  ElementStatusSearch,
  LabelSearch,
  OtherSkillSearch,
  OtherSupportSearch,
  RecoverySupportSearch,
  VanguardSupportSearch,
} from "@/types/searchType";

import { encodeDeck } from "@/endec/serde";
import { charmList } from "@/domain/charm/charm";
import { costumeList } from "@/domain/costume/costume";
import Cookies from "js-cookie";
import { match, P } from "ts-pattern";
import { Lenz } from "@/domain/lenz";
import { isElementEffect, isStackEffect } from "@/parser/skill";
import { activeProjectAtom } from "@/jotai/projectAtoms";

export const targetBeforeAtom = atom<MemoriaId[]>([]);
export const targetAfterAtom = atom<MemoriaId[]>([]);
export const compareModeAtom = atom<MemoriaWithConcentration | undefined>(undefined);
export const candidateAtom = atom<MemoriaWithConcentration | undefined>(undefined);
export const adLevelAtom = atom(3);
export const charmAtom = atom(charmList.reverse()[0]);
export const costumeAtom = atom(costumeList.reverse()[0]);
export const defAtom = atom(400_000);
export const spDefAtom = atom(400_000);
export const statusAtom = atom([200_000, 200_000, 200_000, 200_000] as [
  number,
  number,
  number,
  number,
]);
export type Concentration = 0 | 1 | 2 | 3 | 4;
export type MemoriaWithConcentration = Memoria & {
  concentration: Concentration;
};

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

const deckAtom = atom<MemoriaWithConcentration[]>([]);
export const rwDeckAtom = atom(
  (get) => get(deckAtom),
  (
    get,
    set,
    update:
      | MemoriaWithConcentration[]
      | ((prev: MemoriaWithConcentration[]) => MemoriaWithConcentration[]),
  ) => {
    const newValue = typeof update === "function" ? update(get(deckAtom)) : update;
    const index = getDefaultStore().get(activeProjectAtom);
    Cookies.set(
      `deck-${index === false ? 0 : index}`,
      encodeDeck(get(swAtom), newValue, get(rwLegendaryDeckAtom)),
    );
    set(deckAtom, newValue);
  },
);

const legendaryDeckAtom = atom<MemoriaWithConcentration[]>([]);
export const rwLegendaryDeckAtom = atom(
  (get) => get(legendaryDeckAtom),
  (
    get,
    set,
    update:
      | MemoriaWithConcentration[]
      | ((prev: MemoriaWithConcentration[]) => MemoriaWithConcentration[]),
  ) => {
    const newValue = typeof update === "function" ? update(get(legendaryDeckAtom)) : update;
    const index = getDefaultStore().get(activeProjectAtom);
    Cookies.set(
      `deck-${index === false ? 0 : index}`,
      encodeDeck(get(swAtom), get(rwDeckAtom), newValue),
    );
    set(legendaryDeckAtom, newValue);
  },
);

export const unitTitleAtom = atom("No Title");
export const swAtom = atom<"sword" | "shield">("shield");
export const roleFilterAtom = atom<RoleFilterType[]>(["support", "interference", "recovery"]);
export const elementFilterAtom = atom<ElementFilterType[]>([...elementFilter]);
export const labelFilterAtom = atom<LabelSearch[]>([]);

export const currentRoleFilterAtom = atom((get) => {
  const sw = get(swAtom);
  return match<"sword" | "shield", RoleFilterType[]>(sw)
    .with("shield", () => ["support", "interference", "recovery"])
    .with("sword", () => ["normal_single", "normal_range", "special_single", "special_range"])
    .exhaustive();
});

export const basicStatusFilterAtom = atom<BasicStatusSearch[]>([]);
export const elementStatusFilterAtom = atom<ElementStatusSearch[]>([]);
export const otherSkillFilterAtom = atom<OtherSkillSearch[]>([]);
export const vanguardSupportFilterAtom = atom<VanguardSupportSearch[]>([]);
export const assistSupportFilterAtom = atom<AssistSupportSearch[]>([]);
export const recoverySupportFilterAtom = atom<RecoverySupportSearch[]>([]);
export const otherSupportFilterAtom = atom<OtherSupportSearch[]>([]);

export const resetFilterAtom = atom(null, (_, set) => {
  set(labelFilterAtom, []);
  set(basicStatusFilterAtom, []);
  set(elementStatusFilterAtom, []);
  set(otherSkillFilterAtom, []);
  set(vanguardSupportFilterAtom, []);
  set(assistSupportFilterAtom, []);
  set(recoverySupportFilterAtom, []);
  set(otherSupportFilterAtom, []);
});

export const sortKindAtom = atom<SortKind>("ID");

export const filteredMemoriaAtom = atom((get) => {
  return memoriaList
    .filter((memoria) => {
      const sw = match(get(swAtom))
        .with("shield", () => ["支援", "妨害", "回復"].includes(memoria.cardType))
        .with("sword", () =>
          ["通常単体", "通常範囲", "特殊単体", "特殊範囲"].includes(memoria.cardType),
        )
        .exhaustive();

      const role = get(roleFilterAtom).some((filter) => {
        return memoria.cardType === roleFilterMap[filter];
      });

      const element = get(elementFilterAtom).some((filter) => {
        return memoria.attribute === filter;
      });

      const label = get(labelFilterAtom).every((filter) => {
        return memoria.labels.includes(filter);
      });

      const basicStatus = get(basicStatusFilterAtom).every((filter) => {
        return Lenz.memoria.gvgSkill.effects.get(memoria).some((eff) =>
          match(eff)
            .with({ status: filter.status }, ({ type }) =>
              match(filter.upDown)
                .with("UP", () => type === "buff")
                .with("DOWN", () => type === "debuff")
                .exhaustive(),
            )
            .otherwise(() => false),
        );
      });

      const elementStatus = get(elementStatusFilterAtom).every((filter) => {
        return Lenz.memoria.gvgSkill.effects.get(memoria).some((eff) =>
          match(eff)
            .with({ status: filter.status }, ({ type }) =>
              match(filter.upDown)
                .with("UP", () => type === "buff")
                .with("DOWN", () => type === "debuff")
                .exhaustive(),
            )
            .otherwise(() => false),
        );
      });

      const otherSkill = get(otherSkillFilterAtom).every((filter) => {
        return match(filter)
          .with(P.union("anima", "barrier", "meteor", "eden"), (filter) =>
            Lenz.memoria.gvgSkill.effects.get(memoria).some(isStackEffect(filter)),
          )
          .with(P.union("minima", "spread", "enhance"), (filter) =>
            Lenz.memoria.gvgSkill.effects.get(memoria).some(isElementEffect(filter)),
          )
          .with(
            P.union("heal", "charge", "counter", "s-counter"),
            (filter) => !!Lenz.memoria.gvgSkill.kinds.get(memoria)?.some((kind) => kind === filter),
          )
          .otherwise(({ element, kind }) =>
            Lenz.memoria.gvgSkill.kinds.get(memoria)?.some((k) =>
              match(k)
                .with({ element, kind }, () => true)
                .otherwise(() => false),
            ),
          );
      });

      const vanguardSupport = get(vanguardSupportFilterAtom).every((filter) => {
        if (typeof filter === "string") {
          return Lenz.memoria.autoSkill.effects.get(memoria).some((x) => x.type === filter);
        }
        return Lenz.memoria.autoSkill.effects.get(memoria).some((x) => {
          return x.status === filter.status && x.type === filter.upDown;
        });
      });

      const assistSupport = get(assistSupportFilterAtom).every((filter) => {
        if (typeof filter === "string") {
          return Lenz.memoria.autoSkill.effects.get(memoria).some((x) => x.type === filter);
        }
        return Lenz.memoria.autoSkill.effects.get(memoria).some((x) => {
          return x.status === filter.status && x.type === filter.upDown;
        });
      });

      const recoverySupport = get(recoverySupportFilterAtom).every((filter) => {
        if (typeof filter === "string") {
          return Lenz.memoria.autoSkill.effects.get(memoria).some((x) => x.type === filter);
        }
        return Lenz.memoria.autoSkill.effects.get(memoria).some((x) => {
          return x.status === filter.status && x.type === filter.upDown;
        });
      });

      const otherSupport = get(otherSupportFilterAtom).every((filter) => {
        return Lenz.memoria.autoSkill.effects.get(memoria).some((x) => {
          return x.type === filter;
        });
      });

      return (
        sw &&
        role &&
        element &&
        label &&
        basicStatus &&
        elementStatus &&
        otherSkill &&
        vanguardSupport &&
        assistSupport &&
        recoverySupport &&
        otherSupport &&
        !get(rwDeckAtom).some(
          ({ name }) => Lenz.memoria.general.shortName.get(memoria) === name.short,
        ) &&
        !get(rwLegendaryDeckAtom).some(
          ({ name }) => Lenz.memoria.general.shortName.get(memoria) === name.short,
        )
      );
    })
    .sort((a, b) => {
      return match(get(sortKindAtom))
        .with("ID", () => b.id - a.id)
        .with("NAME", () => a.name.short.localeCompare(b.name.short))
        .with("ATK", () => b.status[4][0] - a.status[4][0])
        .with("Sp.ATK", () => b.status[4][1] - a.status[4][1])
        .with("DEF", () => b.status[4][2] - b.status[4][1])
        .with("Sp.DEF", () => b.status[4][3] - b.status[4][3])
        .with(
          "ATK+Sp.ATK",
          () => b.status[4][0] + b.status[4][1] - (a.status[4][0] + a.status[4][1]),
        )
        .with(
          "DEF+Sp.DEF",
          () => b.status[4][2] + b.status[4][3] - (a.status[4][2] + a.status[4][3]),
        )
        .exhaustive();
    });
});
