import { match } from "ts-pattern";
import type { MemoriaWithConcentration } from "@/jotai/memoriaAtoms";
import type { Attribute } from "@/parser/skill";
import { INITIAL_ATTRIBUTE_RATES } from "../constants";
import type { AttributeRates } from "../types";
import { Memoria } from "@/domain/memoria/memoria";

type TriggerType = "Attack/Physical" | "Attack/Magical" | "Assist" | "Recovery";

/**
 * レジェンダリースキルの倍率を属性とトリガーで集計
 */
function aggregateLegendaryRates(
  deck: MemoriaWithConcentration[],
  attributes: Attribute[],
  trigger: TriggerType,
): AttributeRates {
  const rates = { ...INITIAL_ATTRIBUTE_RATES };

  for (const memoria of deck) {
    const legendary = memoria.skills.legendary;
    if (!legendary) continue;

    const isMatch =
      legendary.skill.trigger === trigger &&
      attributes.some((attr) => legendary.skill.attributes.includes(attr));

    if (isMatch) {
      for (const attr of attributes) {
        if (legendary.skill.attributes.includes(attr)) {
          rates[attr] += legendary.skill.rates[memoria.concentration] || 0;
        }
      }
    }
  }

  return rates;
}

/**
 * 攻撃系（通常/特殊）のレジェンダリースキル倍率を取得
 */
export function getAttackLegendaryRates(
  deck: MemoriaWithConcentration[],
  isPhysical: boolean,
): AttributeRates {
  const trigger = isPhysical ? "Attack/Physical" : "Attack/Magical";
  return aggregateLegendaryRates(deck, ["Fire", "Water", "Wind"], trigger);
}

/**
 * サポート系のレジェンダリースキル倍率を取得
 */
export function getSupportLegendaryRates(deck: MemoriaWithConcentration[]): AttributeRates {
  return aggregateLegendaryRates(deck, ["Fire", "Water", "Wind"], "Assist");
}

/**
 * 回復系のレジェンダリースキル倍率を取得
 */
export function getRecoveryLegendaryRates(deck: MemoriaWithConcentration[]): AttributeRates {
  return aggregateLegendaryRates(deck, ["Fire", "Water", "Wind"], "Recovery");
}

/**
 * カードタイプに応じたレジェンダリー倍率を取得
 */
export function getLegendaryRateByCardType(
  cardType: Memoria["cardType"],
  attribute: Attribute,
  normalRates: AttributeRates,
  specialRates: AttributeRates,
  supportRates: AttributeRates,
): number {
  return match(cardType)
    .with(1, 2, () => normalRates[attribute])
    .with(3, 4, () => specialRates[attribute])
    .with(5, 6, () => supportRates[attribute])
    .otherwise(() => 1.0);
}
