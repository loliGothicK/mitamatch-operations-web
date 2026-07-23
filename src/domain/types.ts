import type { MemoriaWithConcentration } from "@/jotai/memoriaAtoms";

export type Unit = {
  sw: "sword" | "shield";
  deck: MemoriaWithConcentration[];
  legendaryDeck: MemoriaWithConcentration[];
};

export type LegionMemoria = MemoriaWithConcentration & {
  assignedUserId?: string;
  assignedUserName?: string;
};

export type LegionUnit = {
  sw: "sword" | "shield";
  deck: LegionMemoria[];
  legendaryDeck: LegionMemoria[];
};
