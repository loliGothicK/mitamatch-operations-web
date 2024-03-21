import { z } from 'zod';

import memoriaData from './memoria.json';

export const memoriaSchema = z.object({
  id: z.number(),
  link: z.string(),
  name: z.string(),
  full_name: z.string(),
  kind: z.enum([
    '通常単体',
    '通常範囲',
    '特殊単体',
    '特殊範囲',
    '支援',
    '妨害',
    '回復',
  ]),
  element: z.enum(['火', '水', '風', '光', '闇']),
  status: z.array(z.array(z.number())),
  cost: z.number(),
  skill: z.object({
    name: z.string(),
    description: z.string(),
  }),
  support: z.object({
    name: z.string(),
    description: z.string(),
  }),
  labels: z.array(z.string()),
});

export type Memoria = z.infer<typeof memoriaSchema>;

export const memoriaList = memoriaData.data.map((memoria) =>
  memoriaSchema.parse(memoria),
);
