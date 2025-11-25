import { z } from "zod";

import costumeData from "./character.json";

const characterSchema = z.object({
  name: z.string(),
  kanaName: z.string(),
  firstName: z.string(),
  legion: z.string(),
  garden: z.string(),
  grade: z.string(),
  birthday: z.iso.datetime(),
  bloodType: z.union(
    [z.literal("A"), z.literal("B"), z.literal("O"), z.literal("AB")],
    "Invalid blood type",
  ),
  favoriteFood: z.string(),
  hatedFood: z.string(),
  hobby: z.string(),
  introduction: z.string(),
  keyColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  subColor: z.string().regex(/^#[0-9a-f]{6}$/i),
});

export const characterList: z.infer<typeof characterSchema>[] = costumeData.data.map((_) =>
  characterSchema.parse(_),
);
