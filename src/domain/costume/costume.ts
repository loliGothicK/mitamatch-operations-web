import { z } from "zod";

import costumeData from "./costume.json";
import { match, P } from "ts-pattern";
import { Option } from "fp-ts/Option";
import { option } from "fp-ts";

const exSchema = z.object({ name: z.string(), description: z.string() });
const adxSchema = z.object({
  name: z.string(),
  description: z.string(),
  requiredLimitBreak: z
    .union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)])
    .readonly(),
  requiresAwakening: z.boolean().readonly(),
});

const costumeSchema = z.object({
  id: z.number().readonly(),
  name: z.string().readonly(),
  cardType: z
    .union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
      z.literal(6),
      z.literal(7),
    ])
    .transform((type) =>
      match(type)
        .with(1, () => "通常単体" as const)
        .with(2, () => "通常範囲" as const)
        .with(3, () => "特殊単体" as const)
        .with(4, () => "特殊範囲" as const)
        .with(5, () => "支援" as const)
        .with(6, () => "妨害" as const)
        .with(7, () => "回復" as const)
        .exhaustive(),
    )
    .readonly(),
  jobSkills: z.array(z.array(z.string())).readonly(),
  specialSkills: z
    .union([z.array(adxSchema), z.tuple([exSchema.readonly()])])
    .optional()
    .nullable()
    .readonly(),
});

type Ex = {
  type: "ex";
  name: string;
  description: string;
};

type Adx = {
  type: "adx";
  get: (opt: { limitBreak: number; isAwakened: boolean }) => {
    name: string;
    description: string;
  }[];
};

export type Costume = Omit<
  z.infer<typeof costumeSchema>,
  "jobSkills" | "specialSkills"
> & {
  readonly rate: number;
  readonly status: readonly [number, number, number, number];
  readonly specialSkill: Option<Ex | Adx>;
};

export const costumeList: Costume[] = costumeData.data.map((costume) => {
  const { jobSkills, specialSkills, ...parsed } = costumeSchema.parse(costume);
  return {
    ...parsed,
    ...skillsToStatus(jobSkills),
    specialSkill: match(specialSkills)
      .with(P.nullish, () => option.none)
      .with([], () => option.none)
      .with([P._], ([ex]) =>
        option.of({
          type: "ex" as const,
          name: ex.name,
          description: ex.description,
        }),
      )
      .otherwise((adx) =>
        option.of({
          type: "adx" as const,
          get: ({
            limitBreak,
            isAwakened,
          }: {
            limitBreak: number;
            isAwakened: boolean;
          }) => {
            const filteredSkills = adx.filter((skill) => {
              const limitBreakMet = skill.requiredLimitBreak === limitBreak;
              const awakeningMet = !skill.requiresAwakening || isAwakened;
              return limitBreakMet && awakeningMet;
            });

            return filteredSkills.map((skill) => ({
              name: skill.name,
              description: skill.description,
            }));
          },
        }),
      ),
  };
});

function skillsToStatus(skills: readonly string[][]) {
  let rate = 0;
  const status = [0, 0, 0, 0] as [number, number, number, number];
  const statRegex = /^(.+)\+(\d+)/;

  for (const [, stat, value] of skills
    .flat()
    .map((skill) => skill.match(statRegex)!)) {
    switch (stat) {
      case "ATK": {
        status[0] += Number.parseInt(value, 10);
        break;
      }
      case "Sp.ATK": {
        status[1] += Number.parseInt(value, 10);
        break;
      }
      case "DEF": {
        status[2] += Number.parseInt(value, 10);
        break;
      }
      case "Sp.DEF": {
        status[3] += Number.parseInt(value, 10);
        break;
      }
      default:
        rate += Number.parseInt(value, 10);
    }
  }
  return {
    rate,
    status,
  };
}
