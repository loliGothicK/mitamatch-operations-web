// ユーティリティ関数: 時間フォーマット
import { OrderWithPic } from "@/jotai/orderAtoms";
import { useMemo } from "react";
import { match } from "ts-pattern";
import { identity } from "fp-ts/function";
import { Lens } from "monocle-ts";

export const ACCELERATION_ORDER_NAME = "戦術加速";
const DEFAULT_DELAY_SEC = 5;

const delayValue = Lens.fromPath<OrderWithPic>()(["delay", "value"]);

/**
 * タイムラインのオーダーリストを走査し、delaySource='auto'のオーダーのdelayValueを再計算する。
 */
export function normalizeTimeline(timeline: OrderWithPic[]): OrderWithPic[] {
  return timeline.map((order, index) =>
    match(order)
      .with({ delay: { source: "manual" } }, identity)
      .when(
        () => index === 0,
        delayValue.modify(() => 0),
      )
      .when(
        () => timeline[index - 1].name.includes(ACCELERATION_ORDER_NAME),
        delayValue.modify(() => 0),
      )
      .otherwise(delayValue.modify(() => 5)),
  );
}

export const formatTime = (seconds: number) => {
  const m = Math.trunc(seconds / 60);
  const s = Math.abs(seconds % 60);
  const sign = seconds < 0 ? "-" : "";
  return `${sign}${m}:${s.toString().padStart(2, "0")}`;
};

// 計算済みオーダーの型定義
export type ComputedOrder = OrderWithPic & {
  startTime: number; // 待機(Delay)開始時点（残り時間）
  prepareStartTime: number; // 準備開始時点
  activationTime: number; // 発動時点
  endTime: number; // 効果終了時点
  actualPrepareTime: number; // 短縮適用後の準備時間
};

export function useComputedTimeline(timeline: OrderWithPic[]) {
  console.log(timeline);
  return useMemo((): ComputedOrder[] => {
    let currentRemainingTime = 900; // 15:00
    return timeline.map((order, index) => {
      const prevOrder = index > 0 ? timeline[index - 1] : null;

      // ■ 戦術加速チェック
      // 直前のオーダー名に"戦術加速"が含まれていれば、準備時間を5秒にする
      const isPrevAccel = prevOrder?.name.includes("戦術加速");
      const actualPrepareTime = isPrevAccel ? 5 : order.prepare_time;

      // ■ 時間計算
      // 1. Delay消費: 前の終了時間からDelay分引く
      const delay =
        order.delay.source === "manual"
          ? order.delay.value
          : (order.delay.value ?? DEFAULT_DELAY_SEC);
      const prepareStartTime = currentRemainingTime - delay;

      // 2. 準備時間消費: Prepare分引く -> 発動
      const activationTime = prepareStartTime - actualPrepareTime;

      // 3. 効果時間消費: Active分引く -> 終了
      const endTime = activationTime - order.active_time;

      // 次のループのために残り時間を更新
      currentRemainingTime = endTime;

      return {
        ...order,
        startTime: currentRemainingTime + delay + actualPrepareTime + order.active_time,
        prepareStartTime,
        activationTime,
        endTime,
        actualPrepareTime,
      } as ComputedOrder;
    });
  }, [timeline]);
}
