import { z } from 'zod';

import memoriaData from './memoria.json';

const statusSchema = z.tuple([z.number(), z.number(), z.number(), z.number()]);

const memoriaSchema = z.object({
  id: z.number(),
  link: z.string(),
  name: z.string(),
  // biome-ignore lint/style/useNamingConvention: <explanation>
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
  status: z.tuple([
    statusSchema,
    statusSchema,
    statusSchema,
    statusSchema,
    statusSchema,
  ]),
  cost: z.number(),
  skill: z.object({
    name: z.string(),
    description: z.string(),
  }),
  support: z.object({
    name: z.string(),
    description: z.string(),
  }),
  legendary: z.string().optional(),
  labels: z.array(z.string()),
});

/**
 * This type alias `Memoria` represents a memoria object in the application.
 * It is inferred from the `memoriaSchema` which is a zod schema object.
 * The `memoriaSchema` defines the structure of a memoria object, which includes:
 * - id: a number representing the unique identifier of the memoria.
 * - link: a string representing the link associated with the memoria.
 * - name: a string representing the name of the memoria.
 * - full_name: a string representing the full name of the memoria.
 * - kind: an enum representing the kind of the memoria.
 * - element: an enum representing the element of the memoria.
 * - status: a tuple of five statusSchema objects representing the status of the memoria.
 * - cost: a number representing the cost of the memoria.
 * - skill: an object with 'name' and 'description' properties representing the skill of the memoria.
 * - support: an object with 'name' and 'description' properties representing the support of the memoria.
 * - legendary: an optional string representing the legendary status of the memoria.
 * - labels: an array of strings representing the labels of the memoria.
 */
export type Memoria = z.infer<typeof memoriaSchema>;

export const memoriaList = memoriaData.data.map(memoria =>
  memoriaSchema.parse(memoria),
);
