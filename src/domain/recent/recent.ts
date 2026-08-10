import { z } from "zod";
import recentDataRaw from "./recent.json";

export const recentItemSchema = z.object({
  id: z.string().readonly(),
  type: z.enum(["memoria", "costume", "weapon", "order"]).readonly(),
});

const recentSchema = z.object({
  prev: z.array(recentItemSchema).optional().readonly(),
  data: z.array(recentItemSchema).readonly(),
});

export const recentData = recentSchema.parse(recentDataRaw);
export type RecentItemEntry = z.infer<typeof recentItemSchema>;
