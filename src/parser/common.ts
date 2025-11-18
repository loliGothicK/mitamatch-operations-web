import { match, P } from "ts-pattern";
import { type Either, right } from "fp-ts/Either";
import { bail, type MitamaError, CallPath } from "@/error/error";
import type { Attribute } from "@/parser/skill";

export const parseIntSafe = (
  num: string,
  meta: { path: CallPath; memoriaName?: string } = {
    path: CallPath.empty,
  },
): Either<MitamaError, number> => {
  const int = Number.parseInt(num, 10);
  return !Number.isNaN(int)
    ? right(int)
    : bail(num, "given text doesn't match number", {
        ...meta,
        path: meta.path.join("parseIntSafe"),
      });
};

export const parseFloatSafe = (
  num: string,
  meta: { path: CallPath; memoriaName?: string } = {
    path: CallPath.empty,
  },
): Either<MitamaError, number> => {
  const float = Number.parseFloat(num);
  return !Number.isNaN(float)
    ? right(float)
    : bail(num, "given text doesn't match number", {
        ...meta,
        path: meta.path.join("parseFloatSafe"),
      });
};

export const parseElement = (
  element: string,
  meta: { path: CallPath; memoriaName?: string } = {
    path: CallPath.empty,
  },
): Either<MitamaError, Attribute> =>
  match<string, Either<MitamaError, Attribute>>(element)
    .with("火", () => right("Fire"))
    .with("水", () => right("Water"))
    .with("風", () => right("Wind"))
    .with("光", () => right("Light"))
    .with("闇", () => right("Dark"))
    .otherwise((src) =>
      bail(src, "given text doesn't match any element", {
        ...meta,
        path: meta.path.join("parseElement"),
      }),
    );

export type Amount =
  | "small" // 小アップ
  | "medium" // アップ
  | "large" // 大アップ
  | "extra-large" // 特大アップ
  | "super-large" // 超特大アップ
  | "ultra-large" // 極大アップ
  | "super-ultra-large"; // 超極大アップ

export const parseAmount = (
  amount: string,
  meta: { path: CallPath; memoriaName?: string } = {
    path: CallPath.empty,
  },
) =>
  match<string, Either<MitamaError, Amount>>(amount)
    .with(P.union("小アップ", "小ダウン", "小ダメージ", "小回復"), () =>
      right("small"),
    )
    .with(P.union("アップ", "ダウン", "ダメージ", "回復"), () =>
      right("medium"),
    )
    .with(P.union("大アップ", "大ダウン", "大ダメージ", "大回復"), () =>
      right("large"),
    )
    .with(P.union("特大アップ", "特大ダウン", "特大ダメージ", "特大回復"), () =>
      right("extra-large"),
    )
    .with(
      P.union("超特大アップ", "超特大ダウン", "超特大ダメージ", "超特大回復"),
      () => right("super-large"),
    )
    .with(P.union("極大アップ", "極大ダウン", "極大ダメージ", "極大回復"), () =>
      right("ultra-large"),
    )
    .with(
      P.union("超極大アップ", "超極大ダウン", "超極大ダメージ", "超極大回復"),
      () => right("super-ultra-large"),
    )
    .otherwise((src) =>
      bail(src, "given text doesn't match any amount", {
        ...meta,
        path: meta.path.join("parseAmount"),
      }),
    );

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

export const parseStatus = (
  status: string,
  meta: { path: CallPath; memoriaName?: string } = {
    path: CallPath.empty,
  },
) =>
  match<string, Either<MitamaError, StatusKind[]>>(status)
    .with("ATK", () => right(["ATK"]))
    .with("DEF", () => right(["DEF"]))
    .with("Sp.ATK", () => right(["Sp.ATK"]))
    .with("Sp.DEF", () => right(["Sp.DEF"]))
    .with("最大HP", () => right(["Life"]))
    .with("火属性攻撃力", () => right(["Fire ATK"]))
    .with("水属性攻撃力", () => right(["Water ATK"]))
    .with("風属性攻撃力", () => right(["Wind ATK"]))
    .with("光属性攻撃力", () => right(["Light ATK"]))
    .with("闇属性攻撃力", () => right(["Dark ATK"]))
    .with("火属性防御力", () => right(["Fire DEF"]))
    .with("水属性防御力", () => right(["Water DEF"]))
    .with("風属性防御力", () => right(["Wind DEF"]))
    .with("光属性防御力", () => right(["Light DEF"]))
    .with("闇属性防御力", () => right(["Dark DEF"]))
    .with("火属性攻撃力・風属性攻撃力", () => right(["Fire ATK", "Wind ATK"]))
    .with("火属性防御力・風属性防御力", () => right(["Fire DEF", "Wind DEF"]))
    .with("水属性攻撃力・風属性攻撃力", () => right(["Water ATK", "Wind ATK"]))
    .with("水属性防御力・風属性防御力", () => right(["Water DEF", "Wind DEF"]))
    .with("火属性防御力・水属性防御力", () => right(["Fire DEF", "Wind DEF"]))
    .with("火属性攻撃力・水属性攻撃力・風属性攻撃力", () =>
      right(["Fire ATK", "Water ATK", "Wind ATK"]),
    )
    .with("火属性防御力・水属性防御力・風属性防御力", () =>
      right(["Fire DEF", "Water DEF", "Wind DEF"]),
    )
    .otherwise((src) =>
      bail(src, "given text doesn't match any status", {
        ...meta,
        path: meta.path.join("parseStatus"),
      }),
    );
