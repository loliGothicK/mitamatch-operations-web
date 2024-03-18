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
import { LabelSearch } from "@/type/SearchType";

export type Memoria = (typeof data)[0];

export const memoriaAtom = atom<Memoria[]>(() => data);
export const legendaryDeckAtom = atom<Memoria[]>([]);
export const deckAtom = atom<Memoria[]>([]);
export const swAtom = atom<"sword" | "shield">("shield");
export const roleFilterAtom = atom<RoleFilterType[]>([...roleFilter]);
export const elementFilterAtom = atom<ElementFilterType[]>([...elementFilter]);
export const labelFilterAtom = atom<LabelSearch[]>([]);

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

    return (
      sw &&
      role &&
      element &&
      label &&
      !get(deckAtom).some(({ name }) => memoria.name === name) &&
      !get(legendaryDeckAtom).some(({ name }) => memoria.name === name)
    );
  });
});
