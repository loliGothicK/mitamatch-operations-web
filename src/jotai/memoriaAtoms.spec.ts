import { describe, expect, it } from "vitest";
import { createStore } from "jotai";
import { vi } from "vitest";

vi.mock("@/_actions/memoria", () => ({
  getListAction: vi.fn<() => Promise<[]>>(async () => []),
}));

import {
  currentRoleFilterAtom,
  effectiveRoleFilterAtom,
  roleFilterAtom,
  selectedCurrentRoleFilterAtom,
  swAtom,
} from "./memoriaAtoms";

describe("effectiveRoleFilterAtom", () => {
  it("falls back to current sword roles when stale shield filters remain", () => {
    const store = createStore();

    store.set(swAtom, "sword");
    store.set(roleFilterAtom, ["support", "interference", "recovery"]);

    expect(store.get(currentRoleFilterAtom)).toEqual([
      "normal_single",
      "normal_range",
      "special_single",
      "special_range",
    ]);
    expect(store.get(effectiveRoleFilterAtom)).toEqual([
      "normal_single",
      "normal_range",
      "special_single",
      "special_range",
    ]);
  });

  it("keeps current-side partial selection", () => {
    const store = createStore();

    store.set(swAtom, "sword");
    store.set(roleFilterAtom, ["normal_single", "special_range", "support"]);

    expect(store.get(effectiveRoleFilterAtom)).toEqual(["normal_single", "special_range"]);
  });

  it("treats stale opposite-side roles as all selected for the current side UI", () => {
    const store = createStore();

    store.set(swAtom, "sword");
    store.set(roleFilterAtom, ["support", "interference", "recovery"]);

    expect(store.get(selectedCurrentRoleFilterAtom)).toEqual([
      "normal_single",
      "normal_range",
      "special_single",
      "special_range",
    ]);
  });

  it("keeps current-side UI empty when the user explicitly clears all roles", () => {
    const store = createStore();

    store.set(swAtom, "sword");
    store.set(roleFilterAtom, []);

    expect(store.get(selectedCurrentRoleFilterAtom)).toEqual([]);
  });
});
