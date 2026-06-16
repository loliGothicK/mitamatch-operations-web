declare module "@/domain/costume/costume.json" {
  export interface CostumeJson {
    data: Array<{
      id: number;
      name: string;
      cardType: 1 | 2 | 3 | 4 | 5 | 6 | 7;
      rareSkill: {
        name: string;
        description: string;
        note: string;
        effectTime: number;
      };
      jobSkills: Array<Array<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11>>;
      specialSkills?: Array<{
        name: string;
        description: string;
        requiredLimitBreak?: 0 | 1 | 2 | 3;
        requiresAwakening?: boolean;
      }>;
      released_at: string;
      phantasm: boolean;
    }>;
  }

  const costumeJson: CostumeJson;
  export default costumeJson;
}
