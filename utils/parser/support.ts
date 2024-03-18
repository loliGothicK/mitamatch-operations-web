import { Amount, StatusKind } from "@/utils/parser/skill";

type Trigger = "Attack" | "Assist" | "Recovery" | "Command";
type SupportKind =
  | "DamageUp"
  | "SupportUp"
  | "DamageDown"
  | "MatchPtUp"
  | "MpCostDown"
  | "NRangeUp"
  | "Elemental";

type Status = {
  upDown: "up" | "down";
  status: StatusKind[];
};
