import { atomWithStorage } from "jotai/utils";
import { ULID } from "ulid";

export type Editing = {
  type: "deck" | "timeline";
  hash: ULID;
};

export const openAtom = atomWithStorage<Editing | undefined>("open", undefined, undefined, {
  getOnInit: true,
});
