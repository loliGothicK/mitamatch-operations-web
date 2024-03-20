import { StatusKind } from "@/utils/parser/skill";
import { match } from "ts-pattern";

type Trigger = "Attack" | "Assist" | "Recovery" | "Command";

type Status = {
  upDown: "UP" | "DOWN";
  status: Exclude<
    StatusKind,
    "Life" | "Light ATK" | "Light DEF" | "Dark ATK" | "Dark DEF"
  >;
};

export type SupportKind =
  | "DamageUp"
  | "SupportUp"
  | "RecoveryUp"
  | "NormalMatchPtUp"
  | "SpecialMatchPtUp"
  | "MpCostDown"
  | "RangeUp"
  | Status;

type Support = {
  trigger: Trigger;
  kind: SupportKind[];
};

function statusUp(
  status: Exclude<
    StatusKind,
    "Life" | "Light ATK" | "Light DEF" | "Dark ATK" | "Dark DEF"
  >,
): Status {
  return {
    upDown: "UP",
    status,
  };
}

function statusDown(
  status: Exclude<
    StatusKind,
    "Life" | "Light ATK" | "Light DEF" | "Dark ATK" | "Dark DEF"
  >,
): Status {
  return {
    upDown: "DOWN",
    status,
  };
}

export function parse_support(name: string, _: string): Support {
  const trigger = match<string, Trigger>(name)
    .when(
      (name) => name.startsWith("攻:"),
      () => "Attack",
    )
    .when(
      (name) => name.startsWith("援:"),
      () => "Assist",
    )
    .when(
      (name) => name.startsWith("回:"),
      () => "Recovery",
    )
    .when(
      (name) => name.startsWith("コ:"),
      () => "Command",
    )
    .run();

  return match(trigger)
    .with("Command", () => {
      const effects = match<string, SupportKind[]>(name)
        .when(
          (name) => name.includes("MP消費DOWN"),
          () => ["MpCostDown"],
        )
        .when(
          (name) => name.includes("効果範囲"),
          () => ["RangeUp"],
        )
        .run();
      return { trigger, kind: effects };
    })
    .otherwise(() => {
      const regExp = /^(.+) (.+)$/;
      const [_, effects, _level] = name.match(regExp)!;
      const kind = effects.split("/").flatMap((effect) => {
        return (
          match<string, SupportKind[]>(effect)
            // # サポート効果一覧
            // ## 第一効果
            // ### 前衛
            .with("攻:獲得マッチPtUP", () => []) // これだけスラッシュの使い方が異なる、F*CK
            .with("通常単体", () => ["NormalMatchPtUp"])
            .with("特殊単体", () => ["SpecialMatchPtUp"])
            .with("攻:ダメージUP", () => ["DamageUp"])
            .with("攻:パワーUP", () => [statusUp("ATK")])
            .with("攻:パワーDOWN", () => [statusDown("ATK")])
            .with("攻:Sp.パワーUP", () => [statusUp("Sp.ATK")])
            .with("攻:Sp.パワーDOWN", () => [statusDown("Sp.ATK")])
            .with("攻:WパワーDOWN", () => [
              statusDown("ATK"),
              statusDown("Sp.ATK"),
            ])
            .with("攻:ガードUP", () => [statusUp("DEF")])
            .with("攻:ガードDOWN", () => [statusDown("DEF")])
            .with("攻:Sp.ガードUP", () => [statusUp("Sp.DEF")])
            .with("攻:Sp.ガードDOWN", () => [statusDown("Sp.DEF")])
            .with("攻:WガードUP", () => [statusUp("DEF"), statusUp("Sp.DEF")])
            .with("攻:WガードDOWN", () => [
              statusDown("DEF"),
              statusDown("Sp.DEF"),
            ])
            .with("攻:マイトUP", () => [statusUp("ATK"), statusUp("DEF")])
            .with("攻:マイトDOWN", () => [statusDown("ATK"), statusDown("DEF")])
            .with("攻:Sp.マイトUP", () => [
              statusUp("Sp.ATK"),
              statusUp("Sp.DEF"),
            ])
            .with("攻:Sp.マイトDOWN", () => [
              statusDown("Sp.ATK"),
              statusDown("Sp.DEF"),
            ])
            .with("攻:Sp.ディファーDOWN", () => [
              statusDown("ATK"),
              statusDown("Sp.DEF"),
            ])
            // ### 支援/妨害
            .with("援:支援UP", () => ["SupportUp"])
            .with("援:パワーUP", () => [statusUp("ATK")])
            .with("援:パワーDOWN", () => [statusDown("ATK")])
            .with("援:Sp.パワーUP", () => [statusUp("Sp.ATK")])
            .with("援:Sp.パワーDOWN", () => [statusDown("Sp.ATK")])
            .with("援:WパワーUP", () => [statusUp("ATK"), statusUp("Sp.ATK")])
            .with("援:WパワーDOWN", () => [
              statusDown("ATK"),
              statusDown("Sp.ATK"),
            ])
            .with("援:ガードUP", () => [statusUp("DEF")])
            .with("援:ガードDOWN", () => [statusDown("DEF")])
            .with("援:Sp.ガードUP", () => [statusUp("Sp.DEF")])
            .with("援:Sp.ガードDOWN", () => [statusDown("Sp.DEF")])
            .with("援:WガードUP", () => [statusUp("DEF"), statusUp("Sp.DEF")])
            .with("援:WガードDOWN", () => [
              statusDown("DEF"),
              statusDown("Sp.DEF"),
            ])
            .with("援:マイトUP", () => [statusUp("ATK"), statusUp("DEF")])
            .with("援:マイトDOWN", () => [statusDown("ATK"), statusDown("DEF")])
            .with("援:Sp.マイトUP", () => [
              statusUp("Sp.ATK"),
              statusUp("Sp.DEF"),
            ])
            .with("援:Sp.マイトDOWN", () => [
              statusDown("Sp.ATK"),
              statusDown("Sp.DEF"),
            ])
            .with("援:Sp.ディファーDOWN", () => [
              statusDown("ATK"),
              statusDown("Sp.DEF"),
            ])
            .with("援:ディファーDOWN", () => [
              statusDown("Sp.ATK"),
              statusDown("DEF"),
            ])
            .with("援:火パワーUP", () => [statusUp("Fire ATK")])
            .with("援:水パワーUP", () => [statusUp("Water ATK")]) // 現状存在しない
            .with("援:風パワーUP", () => [statusUp("Wind ATK")])
            // ### 回復
            .with("回:回復UP", () => ["RecoveryUp"])
            .with("回:ガードUP", () => [statusUp("DEF")])
            .with("回:Sp.ガードUP", () => [statusUp("Sp.DEF")])
            .with("回:WガードUP", () => [statusUp("DEF"), statusUp("Sp.DEF")])
            .with("回:パワーUP", () => [statusUp("ATK")])
            .with("回:Sp.パワーUP", () => [statusUp("Sp.ATK")])

            // ## 第二効果
            // ### 複合系
            .with("パワーUP", () => [statusUp("ATK")])
            .with("パワーDOWN", () => [statusDown("ATK")])
            .with("Sp.パワーUP", () => [statusUp("Sp.ATK")])
            .with("Sp.パワーDOWN", () => [statusDown("Sp.ATK")])
            .with("ガードUP", () => [statusUp("DEF")])
            .with("ガードDOWN", () => [statusDown("DEF")])
            .with("Sp.ガードUP", () => [statusUp("Sp.DEF")])
            .with("Sp.ガードDOWN", () => [statusDown("Sp.DEF")])
            // ### 副攻
            .with("副攻:火パワーUP", () => [statusUp("Fire ATK")])
            .with("副攻:水パワーUP", () => [statusUp("Water ATK")])
            .with("副攻:風パワーUP", () => [statusUp("Wind ATK")])
            .with("副攻:火ガードDOWN", () => [statusDown("Fire DEF")])
            .with("副攻:水ガードDOWN", () => [statusDown("Water DEF")])
            .with("副攻:風ガードDOWN", () => [statusDown("Wind DEF")])
            // ### 副援
            .with("副援:支援UP", () => ["SupportUp"])
            .with("副援:火パワーUP", () => [statusUp("Fire ATK")])
            .with("副援:水パワーUP", () => [statusUp("Water ATK")])
            .with("副援:風パワーUP", () => [statusUp("Wind ATK")])
            .with("副援:火パワーDOWN", () => [statusDown("Fire ATK")])
            .with("副援:水パワーDOWN", () => [statusDown("Water ATK")])
            .with("副援:風パワーDOWN", () => [statusDown("Water ATK")])
            .with("副援:火ガードUP", () => [statusUp("Fire DEF")])
            .with("副援:水ガードUP", () => [statusUp("Water DEF")])
            .with("副援:風ガードUP", () => [statusUp("Wind DEF")])
            .with("副援:火ガードDOWN", () => [statusDown("Fire DEF")])
            .with("副援:水ガードDOWN", () => [statusDown("Water DEF")]) // 現状存在しない
            .with("副援:風ガードDOWN", () => [statusDown("Wind DEF")]) // 現状存在しない
            .with("副援:トライガードUP", () => [
              statusUp("Fire DEF"),
              statusUp("Water DEF"),
              statusUp("Wind DEF"),
            ])
            .run()
        );
      });
      return {
        trigger,
        kind,
      };
    });
}
