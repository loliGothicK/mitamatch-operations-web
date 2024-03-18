import { match } from "ts-pattern";
import { option } from "fp-ts";
import { Option } from "fp-ts/Option";
import { map, getOrElse } from "fp-ts/lib/Option";

export const statusKind = [
  "ATK",
  "DEF",
  "Sp.ATK",
  "Sp.DEF",
  "Life",
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
export type StatusKind = (typeof statusKind)[number];
// map to japanese
export const statusKindMap = {
  ATK: "攻撃",
  DEF: "防御",
  "Sp.ATK": "特攻",
  "Sp.DEF": "特防",
  Life: "HP",
  "Fire ATK": "火攻",
  "Fire DEF": "火防",
  "Water ATK": "水攻",
  "Water DEF": "水防",
  "Wind ATK": "風攻",
  "Wind DEF": "風防",
  "Light ATK": "光攻",
  "Light DEF": "光防",
  "Dark ATK": "闇攻",
  "Dark DEF": "闇防",
} as const;

type Element = "Fire" | "Water" | "Wind" | "Light" | "Dark";
type ElementalKind = "Stimulation" | "Spread" | "Strengthen" | "Weaken";

type Elemental = {
  element: Element;
  kind: ElementalKind;
};
export type Amount =
  | "small"
  | "medium"
  | "large"
  | "extra-large"
  | "super-large";
type Status = {
  upDown: "up" | "down";
  status: StatusKind[];
  amount: Amount;
};
type SkillKind = Elemental | Status | "charge" | "counter" | "heal";
type BuffKind = "Power" | "Guard" | "Might" | "Defer" | "Life";

export type Skill = {
  name: string;
  description: string;
  upDown: "up" | "down";
  status: StatusKind[];
  amount: Amount;
  effects: SkillKind[];
};

export function parse_skill(name: string, description: string): Skill {
  const elemental = match<string, Option<SkillKind>>(name)
    .when(
      (name) => name.startsWith("火："),
      () => option.of({ element: "Fire", kind: "Stimulation" }),
    )
    .when(
      (name) => name.startsWith("水："),
      () => option.of({ element: "Water", kind: "Stimulation" }),
    )
    .when(
      (name) => name.startsWith("風："),
      () => option.of({ element: "Wind", kind: "Stimulation" }),
    )
    .when(
      (name) => name.startsWith("光："),
      () => option.of({ element: "Light", kind: "Stimulation" }),
    )
    .when(
      (name) => name.startsWith("闇："),
      () => option.of({ element: "Dark", kind: "Stimulation" }),
    )
    .when(
      (name) => name.startsWith("火拡："),
      () => option.of({ element: "Fire", kind: "Spread" }),
    )
    .when(
      (name) => name.startsWith("水拡："),
      () => option.of({ element: "Water", kind: "Spread" }),
    )
    .when(
      (name) => name.startsWith("風拡："),
      () => option.of({ element: "Wind", kind: "Spread" }),
    )
    .when(
      (name) => name.startsWith("光拡："),
      () => option.of({ element: "Light", kind: "Spread" }),
    )
    .when(
      (name) => name.startsWith("闇拡："),
      () => option.of({ element: "Dark", kind: "Spread" }),
    )
    .when(
      (name) => name.startsWith("火強："),
      () => option.of({ element: "Fire", kind: "Strengthen" }),
    )
    .when(
      (name) => name.startsWith("水強："),
      () => option.of({ element: "Water", kind: "Strengthen" }),
    )
    .when(
      (name) => name.startsWith("風強："),
      () => option.of({ element: "Wind", kind: "Strengthen" }),
    )
    .when(
      (name) => name.startsWith("光強："),
      () => option.of({ element: "Light", kind: "Strengthen" }),
    )
    .when(
      (name) => name.startsWith("闇強："),
      () => option.of({ element: "Dark", kind: "Strengthen" }),
    )
    .when(
      (name) => name.startsWith("火弱："),
      () => option.of({ element: "Fire", kind: "Weaken" }),
    )
    .when(
      (name) => name.startsWith("水弱："),
      () => option.of({ element: "Water", kind: "Weaken" }),
    )
    .when(
      (name) => name.startsWith("風弱："),
      () => option.of({ element: "Wind", kind: "Weaken" }),
    )
    .when(
      (name) => name.startsWith("光弱："),
      () => option.of({ element: "Light", kind: "Weaken" }),
    )
    .when(
      (name) => name.startsWith("闇弱："),
      () => option.of({ element: "Dark", kind: "Weaken" }),
    )
    .otherwise(() => option.none);

  const counter = name.includes("カウンター")
    ? option.of("counter" as SkillKind)
    : option.none;
  const charge = name.includes("チャージ")
    ? option.of("charge" as SkillKind)
    : option.none;
  const heal = name.includes("ヒール")
    ? option.of("heal" as SkillKind)
    : option.none;

  const amount = match<string, Amount>(description)
    .when(
      (description) => description.includes("小"),
      () => "small",
    )
    .when(
      (description) => description.includes("大"),
      () => "large",
    )
    .when(
      (description) => description.includes("特大"),
      () => "extra-large",
    )
    .when(
      (description) => description.includes("超特大"),
      () => "super-large",
    )
    .otherwise(() => "medium");

  const upDown = description.includes("ダウン") ? "down" : "up";

  const buffType = name.includes("W") ? "W" : name.includes("Sp") ? "Sp" : "N";
  const buffKind = match<string, Option<BuffKind>>(name)
    .when(
      (name) => name.includes("パワー"),
      () => option.of("Power"),
    )
    .when(
      (name) => name.includes("ガード"),
      () => option.of("Guard"),
    )
    .when(
      (name) => name.includes("マイト"),
      () => option.of("Might"),
    )
    .when(
      (name) => name.includes("ディファー"),
      () => option.of("Defer"),
    )
    .when(
      (name) => name.includes("ライフ"),
      () => option.of("Life"),
    )
    .otherwise(() => option.none);

  const element = match<string, Option<StatusKind[]>>(name)
    .when(
      () => name.includes("[火防]"),
      () => option.of(["Fire DEF"]),
    )
    .when(
      () => name.includes("[水防]"),
      () => option.of(["Water DEF"]),
    )
    .when(
      () => name.includes("[風防]"),
      () => option.of(["Wind DEF"]),
    )
    .when(
      () => name.includes("[火攻]"),
      () => option.of(["Fire ATK"]),
    )
    .when(
      () => name.includes("[水攻]"),
      () => option.of(["Water ATK"]),
    )
    .when(
      () => name.includes("[風攻]"),
      () => option.of(["Wind ATK"]),
    )
    .when(
      () => name.includes("[風攻水防]"),
      () => option.of(["Wind ATK", "Water DEF"]),
    )
    .when(
      () => name.includes("[火攻風防]"),
      () => option.of(["Fire ATK", "Wind DEF"]),
    )
    .when(
      () => name.includes("[水攻火防]"),
      () => option.of(["Water ATK", "Fire DEF"]),
    )
    .when(
      () => name.includes("ファイアパワー"),
      () => option.of(["Fire ATK"]),
    )
    .when(
      () => name.includes("ウォーターパワー"),
      () => option.of(["Water ATK"]),
    )
    .when(
      () => name.includes("ウィンドパワー"),
      () => option.of(["Wind ATK"]),
    )
    .when(
      () => name.includes("ライトパワー"),
      () => option.of(["Light ATK"]),
    )
    .when(
      () => name.includes("ダークパワー"),
      () => option.of(["Dark ATK"]),
    )
    .when(
      () => name.includes("ファイアガード"),
      () => option.of(["Fire DEF"]),
    )
    .when(
      () => name.includes("ウォーターガード"),
      () => option.of(["Water DEF"]),
    )
    .when(
      () => name.includes("ウィンドガード"),
      () => option.of(["Wind DEF"]),
    )
    .when(
      () => name.includes("ライトガード"),
      () => option.of(["Light DEF"]),
    )
    .when(
      () => name.includes("ダークガード"),
      () => option.of(["Dark DEF"]),
    )
    .when(
      () => name.includes("トライパワー"),
      () => option.of(["Fire ATK", "Water ATK", "Wind ATK"]),
    )
    .when(
      () => name.includes("トライガード"),
      () => option.of(["Fire DEF", "Water DEF", "Wind DEF"]),
    )
    .otherwise(() => option.none);

  const effects = [elemental, counter, charge, heal]
    .filter(option.isSome)
    .map((o) => o.value);

  const status = [
    ...getOrElse<StatusKind[]>(() => [])(
      map((kind: BuffKind) => {
        return match<BuffKind, StatusKind[]>(kind)
          .with("Power", () =>
            match<"W" | "Sp" | "N", StatusKind[]>(buffType)
              .with("N", () => ["ATK"])
              .with("Sp", () => ["Sp.ATK"])
              .with("W", () => ["ATK", "Sp.ATK"])
              .exhaustive(),
          )
          .with("Guard", () =>
            match<"W" | "Sp" | "N", StatusKind[]>(buffType)
              .with("N", () => ["DEF"])
              .with("Sp", () => ["Sp.DEF"])
              .with("W", () => ["DEF", "Sp.DEF"])
              .exhaustive(),
          )
          .with("Might", () =>
            match<"W" | "Sp" | "N", StatusKind[]>(buffType)
              .with("Sp", () => ["Sp.ATK", "Sp.DEF"])
              .otherwise(() => ["ATK", "DEF"]),
          )
          .with("Defer", () =>
            match<"W" | "Sp" | "N", StatusKind[]>(buffType)
              .with("Sp", () => ["Sp.ATK", "DEF"])
              .otherwise(() => ["ATK", "Sp.DEF"]),
          )
          .with("Life", () => ["Life"])
          .exhaustive();
      })(buffKind),
    ),
    ...getOrElse<StatusKind[]>(() => [])(
      map((kind: StatusKind[]) => kind)(element),
    ),
  ];

  return {
    name,
    description,
    upDown,
    status,
    amount,
    effects,
  } satisfies Skill;
}
