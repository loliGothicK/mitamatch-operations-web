export const labelSearch = ["legendary", "ultimate"] as const;
export type LabelSearch = (typeof labelSearch)[number];
export const basicStatus = ["ATK", "DEF", "Sp.ATK", "Sp.DEF", "Life"] as const;
export type BasicStatus = (typeof basicStatus)[number];
export const elementStatus = [
  "Fire ATK",
  "Fire DEF",
  "Water ATK",
  "Water DEF",
  "Wind ATK",
  "Wind DEF",
  "Light ATK",
  "Light DEF",
  "Dark ATK",
  "Dark DEF",
] as const;
export type ElementStatus = (typeof elementStatus)[number];
export type BasicStatusSearch = { status: BasicStatus; upDown: "UP" | "DOWN" };
export type ElementStatusSearch = {
  status: ElementStatus;
  upDown: "UP" | "DOWN";
};

export function allBasicStatusSearch(): BasicStatusSearch[] {
  return basicStatus.flatMap((status) => {
    return ["UP", "DOWN"]
      .map((upDown) => {
        return { status, upDown: upDown as "UP" | "DOWN" };
      })
      .filter((v) => v.status !== "Life" || v.upDown === "UP");
  });
}

export function allElementStatusSearch(): ElementStatusSearch[] {
  return elementStatus.flatMap((status) => {
    return ["UP", "DOWN"].map((upDown) => {
      return { status, upDown: upDown as "UP" | "DOWN" };
    });
  });
}

export type VanguardSupportSearch =
  | "NormalMatchPtUp"
  | "SpecialMatchPtUp"
  | "DamageUp"
  | BasicStatusSearch
  | ElementStatusSearch;

export function allVanguardSupportSearch(): VanguardSupportSearch[] {
  return [
    "NormalMatchPtUp",
    "SpecialMatchPtUp",
    "DamageUp",
    ...allBasicStatusSearch(),
    ...allElementStatusSearch(),
  ];
}

export type AssistSupportSearch =
  | "SupportUp"
  | BasicStatusSearch
  | ElementStatusSearch;

export function allAssistSupportSearch(): AssistSupportSearch[] {
  return ["SupportUp", ...allBasicStatusSearch(), ...allElementStatusSearch()];
}

export type RecoverySupportSearch =
  | "RecoveryUp"
  | BasicStatusSearch
  | ElementStatusSearch;

export function allRecoverySupportSearch(): RecoverySupportSearch[] {
  return ["RecoveryUp", ...allBasicStatusSearch(), ...allElementStatusSearch()];
}
