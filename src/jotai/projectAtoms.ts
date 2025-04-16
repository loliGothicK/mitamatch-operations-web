import { atom } from 'jotai';

export const projectOpenAtom = atom(true);

export const activeProjectAtom = atom<number | false>(false);

export const openProjectListAtom = atom<Map<string, number>>(
  new Map<string, number>(),
);
