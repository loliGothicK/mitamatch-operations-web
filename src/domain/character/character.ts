import { z } from "zod";

import costumeData from "./character.json";

/**
 * Rune Names
 * see: https://en.wikipedia.org/wiki/Anglo-Saxon_runes
 */
const runeSchema = z.union([
  z.literal("feh"),
  z.literal("ur"),
  z.literal("thorn"),
  z.literal("os"),
  z.literal("rada"),
  z.literal("cen"),
  z.literal("gyfu"),
  z.literal("wyn"),
  z.literal("haegil"),
  z.literal("naed"),
  z.literal("is"),
  z.literal("gaer"),
  z.literal("ih"),
  z.literal("peord"),
  z.literal("ilcs"),
  z.literal("sygil"),
  z.literal("ti"),
  z.literal("berc"),
  z.literal("eh"),
  z.literal("mon"),
  z.literal("lagu"),
  z.literal("ing"),
  z.literal("oedil"),
  z.literal("daeg"),
  z.literal("ac"),
  z.literal("aesc"),
  z.literal("ear"),
  z.literal("yr"),
]);

export type Rune = z.infer<typeof runeSchema>;

const runeSpecSchema = z.object({
  rune: runeSchema,
  variant: z.number().optional(),
});

export type RuneSpec = z.infer<typeof runeSpecSchema>;

const characterSchema = z.object({
  id: z.number().readonly(),
  name: z.string().readonly(),
  kanaName: z.string().readonly(),
  firstName: z.string().readonly(),
  voiceActor: z.string().readonly(),
  legion: z.string().readonly(),
  garden: z.string().readonly(),
  grade: z.string().readonly(),
  birthday: z.iso.datetime({ offset: true }).transform((birthday) =>
    new Date(birthday).toLocaleDateString("ja-JP", {
      month: "long",
      day: "numeric",
    }),
  ).readonly(),
  favorites: z.string().readonly(),
  hates: z.string().readonly(),
  hobby: z.string().readonly(),
  introduction: z.string().readonly(),
  keyColor: z.string().regex(/^[0-9a-f]{6}$/i).readonly(),
  subColor: z.string().regex(/^[0-9a-f]{6}$/i).readonly(),
  bindRune: z.tuple([runeSpecSchema, runeSpecSchema]).optional().readonly(),
  phantasm: z.boolean().readonly().optional(),
});

export type Character = z.infer<typeof characterSchema>;

export const characterList: z.infer<typeof characterSchema>[] = costumeData.data.map((_) =>
  characterSchema.parse(_),
);
