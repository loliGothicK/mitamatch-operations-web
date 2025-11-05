import type { MemoriaWithConcentration } from "@/jotai/memoriaAtoms";

export type Unit = {
  sw: "sword" | "shield";
  deck: MemoriaWithConcentration[];
  legendaryDeck: MemoriaWithConcentration[];
};
