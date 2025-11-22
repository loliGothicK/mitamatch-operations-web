import { Lens } from "monocle-ts";
import type { Memoria } from "@/domain/memoria/memoria";

export const memoriaLens = {
  id: Lens.fromPath<Memoria>()(["id"]),
  shortName: Lens.fromPath<Memoria>()(["name", "short"]),
  fullName: Lens.fromPath<Memoria>()(["name", "full"]),
  cardType: Lens.fromPath<Memoria>()(["cardType"]),
  attribute: Lens.fromPath<Memoria>()(["attribute"]),
  status: Lens.fromPath<Memoria>()(["status"]),
  atk: Lens.fromPath<Memoria>()(["status", "4", "0"]),
  spatk: Lens.fromPath<Memoria>()(["status", "4", "1"]),
  def: Lens.fromPath<Memoria>()(["status", "4", "2"]),
  spdef: Lens.fromPath<Memoria>()(["status", "4", "3"]),
  cost: Lens.fromPath<Memoria>()(["cost"]),
  labels: Lens.fromPath<Memoria>()(["labels"]),
  questSkill: Lens.fromPath<Memoria>()(["skills", "questSkill"]),
  gvgSkill: Lens.fromPath<Memoria>()(["skills", "gvgSkill"]),
  autoSkill: Lens.fromPath<Memoria>()(["skills", "autoSkill"]),
  legendary: Lens.fromPath<Memoria>()(["skills", "legendary"]),
};

export const gvgSkillLens = {
  name: Lens.fromPath<Memoria>()(["skills", "gvgSkill", "raw", "name"]),
  description: Lens.fromPath<Memoria>()([
    "skills",
    "gvgSkill",
    "raw",
    "description",
  ]),
  effects: Lens.fromPath<Memoria>()(["skills", "gvgSkill", "effects"]),
  kinds: Lens.fromPath<Memoria>()(["skills", "gvgSkill", "kinds"]),
};

export const supportLens = {
  name: Lens.fromPath<Memoria>()(["skills", "autoSkill", "raw", "name"]),
  description: Lens.fromPath<Memoria>()([
    "skills",
    "autoSkill",
    "raw",
    "description",
  ]),
  trigger: Lens.fromPath<Memoria>()(["skills", "autoSkill", "trigger"]),
  probability: Lens.fromPath<Memoria>()(["skills", "autoSkill", "probability"]),
  effects: Lens.fromPath<Memoria>()(["skills", "autoSkill", "effects"]),
};
