import { getDefaultStore, useAtom } from 'jotai';

const defaultStore = getDefaultStore();

type UseAtomParams = Parameters<typeof useAtom>;

export const useAtomDefault: typeof useAtom = (
  atom: UseAtomParams[0],
  options?: UseAtomParams[1],
) =>
  useAtom(atom, {
    store: defaultStore,
    ...options,
  });
