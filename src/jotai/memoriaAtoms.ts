import { atom } from "jotai";

import { Memoria, MemoriaId, uniqueMemoriaList } from "@/domain/memoria/memoria";
import { memoriaList } from "@/domain/memoria/memoria";
import {
  type ElementFilterType,
  type RoleFilterType,
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
import { match } from "ts-pattern";
import { ATTRIBUTES } from "@/parser/skill";
import { atomWithStorage } from "jotai/utils";
import { atomWithQuery } from "jotai-tanstack-query";
import { getListAction } from "@/_actions/memoria";
import {
  formatMitamaErrors,
  getDefaultDeckBuilderQuery,
  runMemoriaQuery,
} from "@/domain/memoria/query";

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
export const swAtom = atomWithStorage<"sword" | "shield">("sw", "shield", undefined, {
  getOnInit: true,
});
export const roleFilterAtom = atom<RoleFilterType[]>(["support", "interference", "recovery"]);
export const elementFilterAtom = atom<ElementFilterType[]>([...ATTRIBUTES]);
export const labelFilterAtom = atom<LabelFilterType[]>([...labelFilter]);
export const ownedFilterAtom = atom(false);
export const deckBuilderQueryAtom = atomWithStorage<string>(
  "query[deck-builder]",
  getDefaultDeckBuilderQuery("shield"),
  undefined,
  {
    getOnInit: true,
  },
);
const owningAtom = atomWithQuery<{ id: string; name: string; limitBreak: number }[]>(() => ({
  queryKey: ["memoria"],
  queryFn: getListAction,
}));

export const currentRoleFilterAtom = atom((get) => {
  const sw = get(swAtom);
  return match<"sword" | "shield", RoleFilterType[]>(sw)
    .with("shield", () => ["support", "interference", "recovery"])
    .with("sword", () => ["normal_single", "normal_range", "special_single", "special_range"])
    .exhaustive();
});

export const effectiveRoleFilterAtom = atom((get) => {
  const filter = get(roleFilterAtom);
  const currentRoleFilter = get(currentRoleFilterAtom);
  const filtered = filter.filter((value) => currentRoleFilter.includes(value));

  return filtered.length === 0 ? currentRoleFilter : filtered;
});

export const selectedCurrentRoleFilterAtom = atom((get) => {
  const filter = get(roleFilterAtom);
  const currentRoleFilter = get(currentRoleFilterAtom);
  const filtered = filter.filter((value) => currentRoleFilter.includes(value));

  if (filtered.length > 0) {
    return filtered;
  }

  return filter.length > 0 ? currentRoleFilter : [];
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

export const filteredMemoriaAtom = atom<{
  isLoaing: boolean;
  data: MemoriaWithConcentration[];
  error?: string;
}>((get) => {
  const isOwnedFilterEnabled = get(ownedFilterAtom);

  let source: MemoriaWithConcentration[];

  if (isOwnedFilterEnabled) {
    // 2. ONの場合のみ、LoadableなAtomを見に行く
    const value = get(owningAtom);
    source =
      value.data?.flatMap(
        ({ id, limitBreak }) =>
          uniqueMemoriaList
            .get(id)
            ?.cards.map((card) => ({ ...card, concentration: limitBreak as Concentration })) ?? [],
      ) || [];
  } else {
    source = memoriaList
      .filter((memoria) => memoria.phantasm !== true)
      .map((memoria) => ({ ...memoria, concentration: 4 }));
  }
  const queried = runMemoriaQuery(source, get(deckBuilderQueryAtom));
  if (queried._tag === "Left") {
    return {
      isLoaing: false,
      data: [] as MemoriaWithConcentration[],
      error: formatMitamaErrors(queried.left),
    };
  }

  const result = queried.right.filter(
    (memoria: Memoria) =>
      !get(rwDeckAtom).some(({ name }) => name.short === memoria.name.short) &&
      !get(rwLegendaryDeckAtom).some(({ name }) => name.short === memoria.name.short),
  );

  return {
    isLoaing: false,
    data: result,
    error: undefined as string | undefined,
  };
});
