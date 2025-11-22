import { gvgSkillLens, memoriaLens, supportLens } from "@/domain/memoria/lenz";
import { costumeLens } from "@/domain/costume/lenz";

export const Lenz = {
  memoria: {
    general: memoriaLens,
    gvgSkill: gvgSkillLens,
    autoSkill: supportLens,
  },
  costume: {
    general: costumeLens,
  },
};
