import { parseAmount, parseStatus } from "@/parser/common";

import { right, left } from "fp-ts/Either";

describe("parseAmount", () => {
  it.each(["小アップ", "小ダウン", "小ダメージ", "小回復"])(
    'should parse "small" amount correctly',
    (amount) => {
      expect(parseAmount(amount)).toEqual(right("small"));
    },
  );

  it.each(["アップ", "ダウン", "ダメージ", "回復"])(
    'should parse "medium" amount correctly',
    (amount) => {
      expect(parseAmount(amount)).toEqual(right("medium"));
    },
  );

  it.each(["大アップ", "大ダウン", "大ダメージ", "大回復"])(
    'should parse "large" amount correctly',
    (amount) => {
      expect(parseAmount(amount)).toEqual(right("large"));
    },
  );

  it.each(["特大アップ", "特大ダウン", "特大ダメージ", "特大回復"])(
    'should parse "extra-large" amount correctly',
    (amount) => {
      expect(parseAmount(amount)).toEqual(right("extraLarge"));
    },
  );

  it.each(["超特大アップ", "超特大ダウン", "超特大ダメージ", "超特大回復"])(
    'should parse "super-large" amount correctly',
    (amount) => {
      expect(parseAmount(amount)).toEqual(right("superLarge"));
    },
  );

  it.each(["極大アップ", "極大ダウン", "極大ダメージ", "極大回復"])(
    'should parse "ultra-large" amount correctly',
    (amount) => {
      expect(parseAmount(amount)).toEqual(right("ultraLarge"));
    },
  );

  it.each(["超極大アップ", "超極大ダウン", "超極大ダメージ", "超極大回復"])(
    'should parse "super-ultra-large" amount correctly',
    (amount) => {
      expect(parseAmount(amount)).toEqual(right("superUltraLarge"));
    },
  );

  it("should return an error for invalid amount", () => {
    expect(parseAmount("invalid amount")).toEqual(
      left({
        target: "invalid amount",
        msg: "given text doesn't match any amount",
        meta: { path: "parseAmount" },
      }),
    );
  });
});

describe("parseStatus", () => {
  it.each([
    ["ATK", ["ATK"]],
    ["DEF", ["DEF"]],
    ["Sp.ATK", ["Sp.ATK"]],
    ["Sp.DEF", ["Sp.DEF"]],
    ["最大HP", ["Life"]],
    ["火属性攻撃力", ["Fire ATK"]],
    ["水属性攻撃力", ["Water ATK"]],
    ["風属性攻撃力", ["Wind ATK"]],
    ["光属性攻撃力", ["Light ATK"]],
    ["闇属性攻撃力", ["Dark ATK"]],
    ["火属性防御力", ["Fire DEF"]],
    ["水属性防御力", ["Water DEF"]],
    ["風属性防御力", ["Wind DEF"]],
    ["光属性防御力", ["Light DEF"]],
    ["闇属性防御力", ["Dark DEF"]],
    ["火属性攻撃力・風属性攻撃力", ["Fire ATK", "Wind ATK"]],
    ["火属性防御力・風属性防御力", ["Fire DEF", "Wind DEF"]],
    ["水属性攻撃力・風属性攻撃力", ["Water ATK", "Wind ATK"]],
    ["水属性防御力・風属性防御力", ["Water DEF", "Wind DEF"]],
    ["火属性攻撃力・水属性攻撃力・風属性攻撃力", ["Fire ATK", "Water ATK", "Wind ATK"]],
    ["火属性防御力・水属性防御力・風属性防御力", ["Fire DEF", "Water DEF", "Wind DEF"]],
  ])("should parse %s correctly", (input, expected) => {
    expect(parseStatus(input)).toEqual(right(expected));
  });

  it("should return an error for invalid status", () => {
    expect(parseStatus("invalid status")).toEqual(
      left({
        target: "invalid status",
        msg: "given text doesn't match any status",
        meta: { path: "parseStatus" },
      }),
    );
  });
});
