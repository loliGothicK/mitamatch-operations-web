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
export type BasicStatusSearch = { status: BasicStatus; upDown: "up" | "down" };
export type ElementStatusSearch = {
  stat: ElementStatus;
  upDown: "up" | "down";
};

export function allBasicStatusSearch(): BasicStatusSearch[] {
  return basicStatus.flatMap((status) => {
    return ["up", "down"]
      .map((upDown) => {
        return { status, upDown: upDown as "up" | "down" };
      })
      .filter((v) => v.status !== "Life" || v.upDown === "up");
  });
}
