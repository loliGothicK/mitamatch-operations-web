import { z } from 'zod';

import charmData from './charm.json';

export const charmSchema = z.object({
  id: z.number(),
  name: z.string(),
  ability: z.string(),
  status: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  date: z.coerce.date(),
});

export type Charm = z.infer<typeof charmSchema>;

export const charmList = charmData.data.map(charm => charmSchema.parse(charm));
