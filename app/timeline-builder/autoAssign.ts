import { OrderWithPic } from "@/jotai/orderAtoms";
import { UserData } from "@/types/user";
import { orderList } from "@/domain/order/order";

export type Member = NonNullable<UserData["legions"][number]["members"]>[number];

export function getMemberName(m: Member): string {
  return m.displayName ?? m.name;
}

export function assignOrders(
  timeline: OrderWithPic[],
  members: Member[],
  whitelist: string[],
  rearGuard: string[],
): { picShift: string[] | null; subPicShift: string[] | null } {
  let resetIndex = -1;
  for (let i = 0; i < timeline.length; i++) {
    if (timeline[i].effect.includes("オーダー使用リセット")) {
      resetIndex = i;
      break;
    }
  }

  type Candidate = {
    name: string;
    score: number;
  };

  const baseCandidates: Candidate[][] = timeline.map((order, i) => {
    return members
      .map((m) => {
        const name = getMemberName(m);
        let score = 0;
        let isMatch = false;

        let isPayedMatch = false;
        let isFreeMatch = false;

        // 1. Check if they have the exact order or same effect registered
        m.orders.forEach((oName) => {
          const o = orderList.find((x) => x.name === oName);
          if (o && o.effect === order.effect) {
            if (o.payed) isPayedMatch = true;
            else isFreeMatch = true;
          }
        });

        if (isPayedMatch) {
          score = 20; // 課金オーダーは高スコア
          isMatch = true;
        } else if (isFreeMatch) {
          score = 10; // 無課金オーダーは標準スコア
          isMatch = true;
        } else if (whitelist.includes(name)) {
          // 2. If they are whitelisted, they act as substitute unconditionally
          score = -1;
          isMatch = true;
        }

        if (isMatch) {
          // 後衛ボーナス
          if (rearGuard.includes(name)) {
            if (resetIndex !== -1 && i > resetIndex) {
              score += 2; // リセット後は特に後衛を優先
            } else {
              score += 1; // リセット前も後衛を少し優先
            }
          }
          return { name, score };
        }

        return null;
      })
      .filter((c): c is Candidate => c !== null);
  });

  const picCandidates: Candidate[][] = timeline.map((order, i) => {
    if (order.pic) {
      return [{ name: order.pic, score: 10 }];
    }
    return baseCandidates[i].slice().sort((a, b) => b.score - a.score);
  });

  let bestScore = -9999;
  let bestPicShift: string[] | null = null;

  // DFS to find the optimal PIC shift
  function dfs(
    index: number,
    usedPhase1: Set<string>,
    usedPhase2: Set<string>,
    resetCaster: string | null,
    currentShift: string[],
    currentScore: number,
  ) {
    if (index === timeline.length) {
      if (currentScore > bestScore) {
        bestScore = currentScore;
        bestPicShift = [...currentShift];
      }
      return;
    }

    // Pruning: max possible score for remaining orders is 10 * remaining
    const maxRemainingScore = (timeline.length - index) * 10;
    if (currentScore + maxRemainingScore <= bestScore) {
      return;
    }

    const candidates = picCandidates[index];
    for (const candidate of candidates) {
      const name = candidate.name;

      if (index === resetIndex) {
        if (usedPhase1.has(name) || usedPhase2.has(name)) continue;
        currentShift[index] = name;
        dfs(index + 1, usedPhase1, usedPhase2, name, currentShift, currentScore + candidate.score);
      } else if (resetIndex !== -1 && index > resetIndex) {
        if (name === resetCaster || usedPhase2.has(name)) continue;
        currentShift[index] = name;
        usedPhase2.add(name);
        dfs(
          index + 1,
          usedPhase1,
          usedPhase2,
          resetCaster,
          currentShift,
          currentScore + candidate.score,
        );
        usedPhase2.delete(name);
      } else {
        if (name === resetCaster || usedPhase1.has(name)) continue;
        currentShift[index] = name;
        usedPhase1.add(name);
        dfs(
          index + 1,
          usedPhase1,
          usedPhase2,
          resetCaster,
          currentShift,
          currentScore + candidate.score,
        );
        usedPhase1.delete(name);
      }
    }
  }

  dfs(0, new Set(), new Set(), null, Array(timeline.length).fill(""), 0);

  if (bestPicShift === null) return { picShift: null, subPicShift: null };
  const picShift = bestPicShift as string[];

  // Sub PIC
  const subPicShift: string[] = Array.from({ length: timeline.length }, () => "");
  const subPicCounts = new Map<string, number>();

  for (let i = 0; i < timeline.length; i++) {
    // 既に入力されているSub PICがあればそれを尊重
    if (timeline[i].sub) {
      const selected = timeline[i].sub!;
      subPicShift[i] = selected;
      subPicCounts.set(selected, (subPicCounts.get(selected) || 0) + 1);
      continue;
    }

    const candidates = baseCandidates[i].filter((c) => {
      const sub = c.name;
      if (sub === picShift[i]) return false;

      if (i === resetIndex) {
        // If this order is the reset order, the sub must not be assigned to ANY other order in picShift
        return !picShift.some((p, idx) => idx !== i && p === sub);
      }

      // If this order is NOT the reset order:
      // 1. The sub must not be the one who casts the reset order
      if (resetIndex !== -1 && picShift[resetIndex] === sub) return false;

      // 2. The sub must not be assigned to another order in the SAME phase in picShift
      let samePhase = false;
      if (resetIndex === -1) {
        samePhase = picShift.some((p, idx) => idx !== i && p === sub);
      } else if (i < resetIndex) {
        for (let j = 0; j < resetIndex; j++) {
          if (j !== i && picShift[j] === sub) samePhase = true;
        }
      } else {
        for (let j = resetIndex + 1; j < picShift.length; j++) {
          if (j !== i && picShift[j] === sub) samePhase = true;
        }
      }

      return !samePhase;
    });

    if (candidates.length === 0) {
      subPicShift[i] = "";
      continue;
    }
    // 1. Score higher is better (+10 over -1)
    // 2. If score is same, pick someone with fewer Sub PIC assignments
    candidates.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (subPicCounts.get(a.name) || 0) - (subPicCounts.get(b.name) || 0);
    });

    const selected = candidates[0].name;
    subPicShift[i] = selected;
    subPicCounts.set(selected, (subPicCounts.get(selected) || 0) + 1);
  }

  return { picShift, subPicShift };
}
