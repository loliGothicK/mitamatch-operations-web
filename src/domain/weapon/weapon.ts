import { z } from "zod";

import weaponData from "./weapon.json";

const weaponSchema = z.object({
  id: z.ulid().readonly(),
  resourceId: z.number().readonly(),
  name: z.string().readonly(),
  maker: z.string().optional().readonly(),
  effect: z
    .array(
      z.object({
        kind: z.string().readonly(),
        description: z.string().readonly(),
      }),
    )
    .readonly(),
  status: z.tuple([z.number(), z.number(), z.number(), z.number()]).readonly(),
});

export type Weapon = z.infer<typeof weaponSchema>;

export const weaponList: Weapon[] = weaponData.data.map((weapon) => weaponSchema.parse(weapon));
