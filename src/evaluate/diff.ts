import { pipe } from "fp-ts/function";
import { fromNullable } from "fp-ts/Option";
import { option } from "fp-ts";
import { isLeft, left, right } from "fp-ts/Either";
import type { Charm } from "@/domain/charm/charm";
import type { Costume } from "@/domain/costume/costume";
import type { MemoriaWithConcentration } from "@/jotai/memoriaAtoms";
import { ValidateResult } from "@/error/error";
import { evaluate, type StackOption, type EvaluateResult, type EvaluateOptions } from "./evaluate";
import { StatusKind } from "@/evaluate/types";
import { statusKind } from "@/evaluate/constants";
import { projector } from "@/functional/proj";

export type CalcDiffOptions = {
  counter: boolean;
  stack?: {
    before: StackOption;
    after: StackOption;
  };
};

export type CalcDiffResult = {
  expectedToalDamage: [number, number];
  expectedTotalRecovery: [number, number];
  expectedTotalBuff: Map<StatusKind, [number, number]>;
  expectedTotalDebuff: Map<StatusKind, [number, number]>;
};

/**
 * 最終ステータスの計算
 */
export function calcFinalStatus(
  deck: MemoriaWithConcentration[],
  selfStatus: [number, number, number, number],
  charm: Charm,
  costume: Costume,
): [number, number, number, number] {
  const baseStatus: [number, number, number, number] = [
    selfStatus[0] + charm.status[0] + costume.status.summary.particular[0],
    selfStatus[1] + charm.status[1] + costume.status.summary.particular[1],
    selfStatus[2] + charm.status[2] + costume.status.summary.particular[2],
    selfStatus[3] + charm.status[3] + costume.status.summary.particular[3],
  ];

  return deck.reduce(
    (prev, memoria) => [
      prev[0] +
        pipe(
          fromNullable(memoria.status[memoria.concentration]),
          option.chain((s) => fromNullable(s[0])),
          option.getOrElse(() => 0),
        ),
      prev[1] +
        pipe(
          fromNullable(memoria.status[memoria.concentration]),
          option.chain((s) => fromNullable(s[1])),
          option.getOrElse(() => 0),
        ),
      prev[2] +
        pipe(
          fromNullable(memoria.status[memoria.concentration]),
          option.chain((s) => fromNullable(s[2])),
          option.getOrElse(() => 0),
        ),
      prev[3] +
        pipe(
          fromNullable(memoria.status[memoria.concentration]),
          option.chain((s) => fromNullable(s[3])),
          option.getOrElse(() => 0),
        ),
    ],
    baseStatus,
  );
}

/**
 * 入れ替え前後の差分を計算
 */
export function calcDiff(
  candidate: MemoriaWithConcentration,
  deck: MemoriaWithConcentration[],
  legendaryDeck: MemoriaWithConcentration[],
  compareMode: MemoriaWithConcentration,
  selfStatus: [number, number, number, number],
  [def, spDef]: [number, number],
  charm: Charm,
  costume: Costume,
  adxOptions: { limitBraek: number; isAwakened: boolean },
  options: CalcDiffOptions,
): ValidateResult<CalcDiffResult> {
  // デッキの構築
  const deckBefore = [...legendaryDeck, ...deck];
  const deckAfter = deckBefore.map((m) => (m.id === compareMode?.id ? candidate : m));

  // ステータスの計算
  const statusBefore = calcFinalStatus(deckBefore, selfStatus, charm, costume);
  const statusAfter = calcFinalStatus(deckAfter, selfStatus, charm, costume);

  // 評価オプションの構築
  const evaluateOptionsBefore: EvaluateOptions = {
    counter: options.counter,
    stack: pipe(fromNullable(options.stack), option.map(projector("before"))),
  };

  const evaluateOptionsAfter: EvaluateOptions = {
    counter: options.counter,
    stack: pipe(fromNullable(options.stack), option.map(projector("after"))),
  };

  // 評価の実行
  const resultBefore = evaluate(
    deckBefore,
    statusBefore,
    [def, spDef],
    charm,
    costume,
    adxOptions,
    evaluateOptionsBefore,
  );

  const resultAfter = evaluate(
    deckAfter,
    statusAfter,
    [def, spDef],
    charm,
    costume,
    adxOptions,
    evaluateOptionsAfter,
  );

  // エラーハンドリング
  if (isLeft(resultBefore)) return left(resultBefore.left);
  if (isLeft(resultAfter)) return left(resultAfter.left);

  // 結果の集計
  return right({
    expectedToalDamage: [aggregateDamage(resultBefore.right), aggregateDamage(resultAfter.right)],
    expectedTotalRecovery: [
      aggregateRecovery(resultBefore.right),
      aggregateRecovery(resultAfter.right),
    ],
    expectedTotalBuff: aggregateBuffMap(
      resultBefore.right,
      resultAfter.right,
      deckBefore.length,
      deckAfter.length,
    ),
    expectedTotalDebuff: aggregateDebuffMap(
      resultBefore.right,
      resultAfter.right,
      deckBefore.length,
      deckAfter.length,
    ),
  });
}

/**
 * ダメージの合計
 */
function aggregateDamage(result: EvaluateResult): number {
  return result.skill.reduce(
    (acc, { expected }) =>
      acc +
      pipe(
        expected.damage,
        option.getOrElse(() => 0),
      ),
    0,
  );
}

/**
 * 回復の合計
 */
function aggregateRecovery(result: EvaluateResult): number {
  return result.skill.reduce(
    (acc, { expected }) =>
      acc +
      pipe(
        expected.recovery,
        option.getOrElse(() => 0),
      ),
    0,
  );
}

/**
 * バフの集計（スキル + サポート）
 */
function aggregateBuff(result: EvaluateResult, deckSize: number): Map<StatusKind, number> {
  const map = new Map<StatusKind, number>();

  // スキルバフの集計
  for (const { expected } of result.skill) {
    pipe(
      expected.buff,
      option.map((buffs) => {
        for (const { type, amount } of buffs) {
          map.set(type, (map.get(type) ?? 0) + amount);
        }
      }),
    );
  }

  // サポートバフの集計（デッキサイズ分掛ける）
  for (const [type, amount] of Object.entries(result.supportBuff)) {
    if (amount === 0) continue;
    map.set(type as StatusKind, (map.get(type as StatusKind) ?? 0) + amount * deckSize);
  }

  return map;
}

/**
 * デバフの集計（スキル + サポート）
 */
function aggregateDebuff(result: EvaluateResult, deckSize: number): Map<StatusKind, number> {
  const map = new Map<StatusKind, number>();

  // スキルデバフの集計
  for (const { expected } of result.skill) {
    pipe(
      expected.debuff,
      option.map((debuffs) => {
        for (const { type, amount } of debuffs) {
          map.set(type, (map.get(type) ?? 0) + amount);
        }
      }),
    );
  }

  // サポートデバフの集計（デッキサイズ分掛ける）
  for (const [type, amount] of Object.entries(result.supportDebuff)) {
    if (amount === 0) continue;
    map.set(type as StatusKind, (map.get(type as StatusKind) ?? 0) + amount * deckSize);
  }

  return map;
}

/**
 * バフの差分マップを作成
 */
function aggregateBuffMap(
  resultBefore: EvaluateResult,
  resultAfter: EvaluateResult,
  deckSizeBefore: number,
  deckSizeAfter: number,
): Map<StatusKind, [number, number]> {
  const buffBefore = aggregateBuff(resultBefore, deckSizeBefore);
  const buffAfter = aggregateBuff(resultAfter, deckSizeAfter);

  return new Map(
    statusKind.map((type) => [
      type,
      [buffBefore.get(type) ?? 0, buffAfter.get(type) ?? 0] as [number, number],
    ]),
  );
}

/**
 * デバフの差分マップを作成
 */
function aggregateDebuffMap(
  resultBefore: EvaluateResult,
  resultAfter: EvaluateResult,
  deckSizeBefore: number,
  deckSizeAfter: number,
): Map<StatusKind, [number, number]> {
  const debuffBefore = aggregateDebuff(resultBefore, deckSizeBefore);
  const debuffAfter = aggregateDebuff(resultAfter, deckSizeAfter);

  return new Map(
    statusKind.map((type) => [
      type,
      [debuffBefore.get(type) ?? 0, debuffAfter.get(type) ?? 0] as [number, number],
    ]),
  );
}
