import { atom } from "jotai";
import { decodeTime } from "ulid";

import { formatCardType, Memoria, MemoriaId, uniqueMemoriaList } from "@/domain/memoria/memoria";
import { memoriaList } from "@/domain/memoria/memoria";
import {
  type ElementFilterType,
  type RoleFilterType,
  roleFilterMap,
  LabelFilterType,
  labelFilter,
} from "@/types/filterType";
import type {
  AssistSupportSearch,
  BasicStatusSearch,
  ElementStatusSearch,
  OtherSkillSearch,
  OtherSupportSearch,
  RecoverySupportSearch,
  VanguardSupportSearch,
} from "@/types/searchType";

import { charmList } from "@/domain/charm/charm";
import { costumeList } from "@/domain/costume/costume";
import { match, P } from "ts-pattern";
import { Lenz } from "@/domain/lenz";
import { ATTRIBUTES, isElementEffect, isStackEffect } from "@/parser/skill";
import { loadable, atomWithStorage } from "jotai/utils";
import { atomWithQuery } from "jotai-tanstack-query";
import { getListAction } from "@/_actions/memoria";

export const targetBeforeAtom = atom<MemoriaId[]>([]);
export const targetAfterAtom = atom<MemoriaId[]>([]);
export const compareModeAtom = atom<MemoriaWithConcentration | undefined>(undefined);
export const candidateAtom = atom<MemoriaWithConcentration | undefined>(undefined);
export const adLevelAtom = atom(3);
export const charmAtom = atom(charmList.reverse()[0]);
export const costumeAtom = atom(costumeList.reverse()[0]);
export const defAtom = atom(400_000);
export const spDefAtom = atom(400_000);
export const statusAtom = atom([700_000, 700_000, 700_000, 700_000] as [
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
  "ATK",
  "Sp.ATK",
  "DEF",
  "Sp.DEF",
  "ATK+Sp.ATK",
  "DEF+Sp.DEF",
] as const;
export type SortKind = (typeof sortKind)[number];

export const rwDeckAtom = atomWithStorage<MemoriaWithConcentration[]>("deck", [], undefined, {
  getOnInit: true,
});

export const rwLegendaryDeckAtom = atomWithStorage<MemoriaWithConcentration[]>(
  "legendary-deck",
  [],
  undefined,
  {
    getOnInit: true,
  },
);

export const unitTitleAtom = atom("No Title");
export const swAtom = atom<"sword" | "shield">("shield");
export const roleFilterAtom = atom<RoleFilterType[]>(["support", "interference", "recovery"]);
export const elementFilterAtom = atom<ElementFilterType[]>([...ATTRIBUTES]);
export const labelFilterAtom = atom<LabelFilterType[]>([...labelFilter]);
export const ownedFilterAtom = atom(false);
const owningAtom = atomWithQuery<{ id: string; name: string; limitBreak: number; }[]>(() => ({
  queryKey: ["memoria"],
  queryFn: getListAction,
}));
export const owningAtomLoadable = loadable(owningAtom);

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
  const isOwnedFilterEnabled = get(ownedFilterAtom);

  let source: MemoriaWithConcentration[] = [];

  if (isOwnedFilterEnabled) {
    // 2. ONの場合のみ、LoadableなAtomを見に行く
    const value = get(owningAtomLoadable);

    if (value.state !== "hasData") {
      return {
        isLoaing: true,
        data: [],
      };
    }

    // 4. データがある場合のみ展開。
    //    uniqueMemoriaList.get(id)! は危険なので ?. にして空配列フォールバックを入れる
    source = value.data.data!.flatMap(({ id, limitBreak }) => uniqueMemoriaList.get(id)?.cards.map((card) => ({ ...card, concentration: limitBreak as Concentration })) ?? []);
  } else {
    // 5. OFFの場合は既存のリストを使用（ここではフェッチは発生しない）
    source = memoriaList.filter((memoria) => memoria.phantasm !== true).map((memoria) => ({ ...memoria, concentration: 4 }));
  }
  const result = source
    .filter((memoria) => {
      const sw = match(get(swAtom))
        .with("shield", () => memoria.cardType > 4)
        .with("sword", () => memoria.cardType < 5)
        .exhaustive();

      const role = get(roleFilterAtom).some((filter) => {
        return formatCardType(memoria.cardType) === roleFilterMap[filter];
      });

      const element = get(elementFilterAtom).some((filter) => {
        return memoria.attribute === filter;
      });

      const label = match(get(labelFilterAtom))
        .with([], () => false)
        .with(labelFilter, () => true)
        .otherwise((filters) =>
          filters.some((filter) => {
            return match(filter)
              .with("Normal", () =>
                (["Legendary", "Ultimate"] as const).every((lbl) => !memoria.labels.includes(lbl)),
              )
              .otherwise((filter) => memoria.labels.includes(filter));
          }),
        );

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
          .otherwise(({ attribute, kind }) =>
            Lenz.memoria.gvgSkill.kinds.get(memoria)?.some((k) =>
              match(k)
                .with({ element: attribute, kind }, () => true)
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
        .with("ID", () => decodeTime(b.id) - decodeTime(a.id))
        .with("ATK", () => b.status[4][0] - a.status[4][0])
        .with("Sp.ATK", () => b.status[4][1] - a.status[4][1])
        .with("DEF", () => b.status[4][2] - a.status[4][2])
        .with("Sp.DEF", () => b.status[4][3] - a.status[4][3])
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

  return {
    isLoaing: false,
    data: result,
  };
});
