import { z } from 'zod';

import charmData from './charm.json';

const charmSchema = z.object({
  id: z.number().readonly(),
  name: z.string().readonly(),
  ability: z.string().readonly(),
  status: z.tuple([z.number(), z.number(), z.number(), z.number()]).readonly(),
  date: z.coerce.date().readonly(),
});

/**
 * This type alias `Charm` represents a charm object in the application.
 * It is inferred from the `charmSchema` which is a zod schema object.
 * The `charmSchema` defines the structure of a charm object, which includes:
 * - id: a number representing the unique identifier of the charm.
 * - name: a string representing the name of the charm.
 * - ability: a string representing the ability of the charm.
 * - status: a tuple of four numbers representing the status of the charm ([Atk, Sp.ATK, DEF, Sp.DEF]).
 * - date: a date object representing the date the charm was published.
 */
export type Charm = z.infer<typeof charmSchema>;

export const charmList = charmData.data.map(charm => charmSchema.parse(charm));
