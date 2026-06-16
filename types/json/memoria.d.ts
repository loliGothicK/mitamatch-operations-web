declare module "@/domain/memoria/memoria.json" {
  type Skill = {
    name: string;
    description: string;
  };

  export interface MemoriaJson {
    data: Array<{
      id: string;
      uniqueId: string;
      name: string;
      cardType: 1 | 2 | 3 | 4 | 5 | 6 | 7;
      attribute: 1 | 2 | 3 | 4 | 5;
      status: [
        [number, number, number, number],
        [number, number, number, number],
        [number, number, number, number],
        [number, number, number, number],
        [number, number, number, number],
      ];
      cost: number;
      questSkill: {
        name: string;
        description: string;
        sp: number;
      };
      gvgSkill: {
        name: string;
        description: string;
        sp: number;
      };
      autoSkill: Skill;
      legendarySkill?: [Skill, Skill, Skill, Skill, Skill];
      labels: Array<"Legendary" | "Ultimate" | "SuperAwakening">;
      phantasm?: boolean;
    }>;
  }

  const memoriaJson: MemoriaJson;
  export default memoriaJson;
}
