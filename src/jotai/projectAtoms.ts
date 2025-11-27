import { atom } from "jotai";

export const projectOpenAtom = atom(false);

export const activeProjectAtom = atom<number>(0);

export const openProjectListAtom = atom<Map<string, number>>(new Map<string, number>());

export const builderModeAtom = atom<"guest" | "user">("guest");
