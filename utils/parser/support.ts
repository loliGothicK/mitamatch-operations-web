import { StatusKind } from "@/utils/parser/skill";
import { match } from "ts-pattern";

type Trigger = "Attack" | "Assist" | "Recovery" | "Command";

type Status = {
  upDown: "up" | "down";
  status: Exclude<
    StatusKind,
    "Life" | "Light ATK" | "Light DEF" | "Dark ATK" | "Dark DEF"
  >;
};

type SupportKind =
  | "DamageUp"
  | "SupportUp"
  | "RecoveryUp"
  | "NormalMatchPtUp"
  | "SpecialMatchPtUp"
  | "MpCostDown"
  | "RangeUp"
  | Status;

export function toJapanese(kind: SupportKind) {
  return match(kind)
    .with("DamageUp", () => "ダメージUP")
    .with("SupportUp", () => "支援UP")
    .with("RecoveryUp", () => "回復UP")
    .with("NormalMatchPtUp", () => "獲得マッチPtUP/通常単体")
    .with("SpecialMatchPtUp", () => "獲得マッチPtUP/特殊単体")
    .with("MpCostDown", () => "MP消費DOWN")
    .with("RangeUp", () => "効果範囲+1")
    .with({ upDown: "up", status: "ATK" }, () => "パワーUP")
    .with({ upDown: "up", status: "DEF" }, () => "ガードUP")
    .with({ upDown: "up", status: "Sp.ATK" }, () => "Sp.パワーUP")
    .with({ upDown: "up", status: "Sp.DEF" }, () => "Sp.ガードUP")
    .with({ upDown: "up", status: "Fire ATK" }, () => "火攻UP")
    .with({ upDown: "up", status: "Water ATK" }, () => "水攻UP")
    .with({ upDown: "up", status: "Wind ATK" }, () => "風攻UP")
    .with({ upDown: "up", status: "Fire DEF" }, () => "火防UP")
    .with({ upDown: "up", status: "Water DEF" }, () => "水防UP")
    .with({ upDown: "up", status: "Wind DEF" }, () => "風防UP")
    .with({ upDown: "down", status: "ATK" }, () => "パワーDOWN")
    .with({ upDown: "down", status: "DEF" }, () => "ガードDOWN")
    .with({ upDown: "down", status: "Sp.ATK" }, () => "Sp.パワーDOWN")
    .with({ upDown: "down", status: "Sp.DEF" }, () => "Sp.ガードDOWN")
    .with({ upDown: "down", status: "Fire ATK" }, () => "火攻DOWN")
    .with({ upDown: "down", status: "Water ATK" }, () => "水攻DOWN")
    .with({ upDown: "down", status: "Wind ATK" }, () => "風攻DOWN")
    .with({ upDown: "down", status: "Fire DEF" }, () => "火防DOWN")
    .with({ upDown: "down", status: "Water DEF" }, () => "水防DOWN")
    .with({ upDown: "down", status: "Wind DEF" }, () => "風防DOWN")
    .exhaustive();
}

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
    upDown: "up",
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
    upDown: "down",
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

  const effects = match<string, SupportKind[]>(name.split(" ")[0])
    .when(
      (name) => name === "攻:獲得マッチPtUP/通常単体",
      () => ["NormalMatchPtUp"],
    )
    .when(
      (name) => name === "攻:獲得マッチPtUP/特殊単体",
      () => ["SpecialMatchPtUp"],
    )
    .when(
      (name) => name === "攻:マイトUP",
      () => [statusUp("ATK"), statusUp("DEF")],
    )
    .when(
      (name) => name === "攻:マイトDOWN",
      () => [statusDown("ATK"), statusDown("DEF")],
    )
    .when(
      (name) => name === "攻:パワーUP",
      () => [statusUp("ATK")],
    )
    .when(
      (name) => name === "攻:パワーUP/副攻:風パワーUP",
      () => [statusUp("ATK"), statusUp("Wind ATK")],
    )
    .when(
      (name) => name === "攻:パワーUP/副攻:水パワーUP",
      () => [statusUp("ATK"), statusUp("Water ATK")],
    )
    .when(
      (name) => name === "攻:パワーUP/副攻:火パワーUP",
      () => [statusUp("ATK"), statusUp("Fire ATK")],
    )
    .when(
      (name) => name === "攻:パワーDOWN",
      () => [statusDown("ATK")],
    )
    .when(
      (name) => name === "攻:ダメージUP/パワーUP",
      () => ["DamageUp", statusUp("ATK")],
    )
    .when(
      (name) => name === "攻:ダメージUP/ガードDOWN",
      () => ["DamageUp", statusDown("DEF")],
    )
    .when(
      (name) => name === "攻:ダメージUP/Sp.パワーUP",
      () => ["DamageUp", statusUp("Sp.ATK")],
    )
    .when(
      (name) => name === "攻:ダメージUP/Sp.ガードDOWN",
      () => ["DamageUp", statusDown("Sp.DEF")],
    )
    .when(
      (name) => name === "攻:ダメージUP",
      () => ["DamageUp"],
    )
    .when(
      (name) => name === "攻:ダメージUP/副攻:水パワーUP",
      () => ["DamageUp", statusUp("Water ATK")],
    )
    .when(
      (name) => name === "攻:ダメージUP/副攻:火パワーUP",
      () => ["DamageUp", statusUp("Fire ATK")],
    )
    .when(
      (name) => name === "攻:ダメージUP/副攻:風パワーUP",
      () => ["DamageUp", statusUp("Wind ATK")],
    )
    .when(
      (name) => name === "攻:ダメージUP/副攻:火ガードDOWN",
      () => ["DamageUp", statusDown("Fire DEF")],
    )
    .when(
      (name) => name === "攻:ダメージUP/副攻:水ガードDOWN",
      () => ["DamageUp", statusDown("Water DEF")],
    )
    .when(
      (name) => name === "攻:ガードUP",
      () => [statusUp("DEF")],
    )
    .when(
      (name) => name === "攻:ガードDOWN",
      () => [statusDown("DEF")],
    )
    .when(
      (name) => name === "攻:ガードDOWN/副攻:火ガードDOWN",
      () => [statusDown("DEF"), statusDown("Fire DEF")],
    )
    .when(
      (name) => name === "攻:ガードDOWN/副攻:水ガードDOWN",
      () => [statusDown("DEF"), statusDown("Water DEF")],
    )
    .when(
      (name) => name === "攻:WパワーDOWN",
      () => [statusDown("ATK"), statusDown("Sp.ATK")],
    )
    .when(
      (name) => name === "攻:WガードUP",
      () => [statusUp("DEF"), statusUp("Sp.DEF")],
    )
    .when(
      (name) => name === "攻:Sp.マイトUP",
      () => [statusUp("Sp.ATK"), statusUp("Sp.DEF")],
    )
    .when(
      (name) => name === "攻:Sp.マイトDOWN",
      () => [statusDown("Sp.ATK"), statusDown("Sp.DEF")],
    )
    .when(
      (name) => name === "攻:Sp.パワーUP",
      () => [statusUp("Sp.ATK")],
    )
    .when(
      (name) => name === "攻:Sp.パワーUP/副攻:風パワーUP",
      () => [statusUp("Sp.ATK"), statusUp("Wind ATK")],
    )
    .when(
      (name) => name === "攻:Sp.パワーUP/副攻:水パワーUP",
      () => [statusUp("Sp.ATK"), statusUp("Water ATK")],
    )
    .when(
      (name) => name === "攻:Sp.パワーUP/副攻:火パワーUP",
      () => [statusUp("Sp.ATK"), statusUp("Fire ATK")],
    )
    .when(
      (name) => name === "攻:Sp.パワーDOWN",
      () => [statusDown("Sp.ATK")],
    )
    .when(
      (name) => name === "攻:Sp.ディファーDOWN",
      () => [statusDown("Sp.ATK"), statusDown("DEF")],
    )
    .when(
      (name) => name === "攻:Sp.ガードUP",
      () => [statusUp("Sp.DEF")],
    )
    .when(
      (name) => name === "攻:Sp.ガードDOWN",
      () => [statusDown("Sp.DEF")],
    )
    .when(
      (name) => name === "攻:Sp.ガードDOWN/副攻:火ガードDOWN",
      () => [statusDown("Sp.DEF"), statusDown("Fire DEF")],
    )
    .when(
      (name) => name === "攻:Sp.ガードDOWN/副攻:水ガードDOWN",
      () => [statusDown("Sp.DEF"), statusDown("Water DEF")],
    )
    .when(
      (name) => name === "援:支援UP",
      () => ["SupportUp"],
    )
    .when(
      (name) => name === "援:支援UP/パワーUP",
      () => ["SupportUp", statusUp("ATK")],
    )
    .when(
      (name) => name === "援:支援UP/パワーDOWN",
      () => ["SupportUp", statusDown("ATK")],
    )
    .when(
      (name) => name === "援:支援UP/ガードDOWN",
      () => ["SupportUp", statusDown("DEF")],
    )
    .when(
      (name) => name === "援:支援UP/Sp.パワーUP",
      () => ["SupportUp", statusUp("Sp.ATK")],
    )
    .when(
      (name) => name === "援:支援UP/Sp.パワーDOWN",
      () => ["SupportUp", statusDown("Sp.ATK")],
    )
    .when(
      (name) => name === "援:支援UP/Sp.ガードUP",
      () => ["SupportUp", statusUp("Sp.DEF")],
    )
    .when(
      (name) => name === "援:支援UP/副援:水パワーUP",
      () => ["SupportUp", statusUp("Water ATK")],
    )
    .when(
      (name) => name === "援:支援UP/副援:火パワーDOWN",
      () => ["SupportUp", statusDown("Fire ATK")],
    )
    .when(
      (name) => name === "援:支援UP/副援:水パワーDOWN",
      () => ["SupportUp", statusDown("Water ATK")],
    )
    .when(
      (name) => name === "援:支援UP/副援:火パワーUP",
      () => ["SupportUp", statusUp("Fire ATK")],
    )
    .when(
      (name) => name === "援:支援UP/副援:風パワーUP",
      () => ["SupportUp", statusUp("Wind ATK")],
    )
    .when(
      (name) => name === "援:支援UP/副援:風パワーDOWN",
      () => ["SupportUp", statusDown("Wind ATK")],
    )
    .when(
      (name) => name === "援:マイトUP",
      () => [statusUp("ATK"), statusUp("DEF")],
    )
    .when(
      (name) => name === "援:マイトDOWN",
      () => [statusDown("ATK"), statusDown("DEF")],
    )
    .when(
      (name) => name === "援:パワーUP",
      () => [statusUp("ATK")],
    )
    .when(
      (name) => name === "援:パワーUP/副援:風パワーUP",
      () => [statusUp("ATK"), statusUp("Wind ATK")],
    )
    .when(
      (name) => name === "援:パワーUP/副援:水パワーUP",
      () => [statusUp("ATK"), statusUp("Water ATK")],
    )
    .when(
      (name) => name === "援:パワーUP/副援:火パワーUP",
      () => [statusUp("ATK"), statusUp("Fire ATK")],
    )
    .when(
      (name) => name === "援:パワーDOWN/副援:風パワーDOWN",
      () => [statusDown("ATK"), statusDown("Wind ATK")],
    )
    .when(
      (name) => name === "援:パワーDOWN/副援:水パワーDOWN",
      () => [statusDown("ATK"), statusDown("Water ATK")],
    )
    .when(
      (name) => name === "援:パワーDOWN/副援:火パワーDOWN",
      () => [statusDown("ATK"), statusDown("Fire ATK")],
    )
    .when(
      (name) => name === "援:パワーDOWN",
      () => [statusDown("ATK")],
    )
    .when(
      (name) => name === "援:ディファーDOWN",
      () => [statusDown("ATK"), statusDown("DEF")],
    )
    .when(
      (name) => name === "援:ガードUP",
      () => [statusUp("DEF")],
    )
    .when(
      (name) => name === "援:ガードDOWN",
      () => [statusDown("DEF")],
    )
    .when(
      (name) => name === "援:ガードDOWN/副援:風ガードDOWN",
      () => [statusDown("DEF"), statusDown("Wind DEF")],
    )
    .when(
      (name) => name === "援:ガードDOWN/副援:水ガードDOWN",
      () => [statusDown("DEF"), statusDown("Water DEF")],
    )
    .when(
      (name) => name === "援:ガードDOWN/副援:火ガードDOWN",
      () => [statusDown("DEF"), statusDown("Fire DEF")],
    )
    .when(
      (name) => name === "援:火パワーUP",
      () => [statusUp("Fire ATK")],
    )
    .when(
      (name) => name === "援:風パワーUP",
      () => [statusUp("Wind ATK")],
    )
    .when(
      (name) => name === "援:WパワーUP",
      () => [statusUp("ATK"), statusUp("Sp.ATK")],
    )
    .when(
      (name) => name === "援:WパワーDOWN",
      () => [statusDown("ATK"), statusDown("Sp.ATK")],
    )
    .when(
      (name) => name === "援:WガードUP",
      () => [statusUp("DEF"), statusUp("Sp.DEF")],
    )
    .when(
      (name) => name === "援:WガードDOWN",
      () => [statusDown("DEF"), statusDown("Sp.DEF")],
    )
    .when(
      (name) => name === "援:Sp.マイトUP",
      () => [statusUp("Sp.ATK"), statusUp("Sp.DEF")],
    )
    .when(
      (name) => name === "援:Sp.マイトDOWN",
      () => [statusDown("Sp.ATK"), statusDown("Sp.DEF")],
    )
    .when(
      (name) => name === "援:Sp.パワーUP",
      () => [statusUp("Sp.ATK")],
    )
    .when(
      (name) => name === "援:Sp.パワーUP/副援:風パワーUP",
      () => [statusUp("Sp.ATK"), statusUp("Wind ATK")],
    )
    .when(
      (name) => name === "援:Sp.パワーUP/副援:水パワーUP",
      () => [statusUp("Sp.ATK"), statusUp("Water ATK")],
    )
    .when(
      (name) => name === "援:Sp.パワーUP/副援:火パワーUP",
      () => [statusUp("Sp.ATK"), statusUp("Fire ATK")],
    )
    .when(
      (name) => name === "援:Sp.パワーDOWN/副援:風パワーDOWN",
      () => [statusDown("Sp.ATK"), statusDown("Wind ATK")],
    )
    .when(
      (name) => name === "援:Sp.パワーDOWN/副援:水パワーDOWN",
      () => [statusDown("Sp.ATK"), statusDown("Water ATK")],
    )
    .when(
      (name) => name === "援:Sp.パワーDOWN/副援:火パワーDOWN",
      () => [statusDown("Sp.ATK"), statusDown("Fire ATK")],
    )
    .when(
      (name) => name === "援:Sp.パワーDOWN",
      () => [statusDown("Sp.ATK")],
    )
    .when(
      (name) => name === "援:Sp.ガードUP",
      () => [statusUp("Sp.DEF")],
    )
    .when(
      (name) => name === "援:Sp.ガードDOWN",
      () => [statusDown("Sp.DEF")],
    )
    .when(
      (name) => name === "援:Sp.ガードDOWN/副援:風ガードDOWN",
      () => [statusDown("Sp.DEF"), statusDown("Wind DEF")],
    )
    .when(
      (name) => name === "援:Sp.ガードDOWN/副援:水ガードDOWN",
      () => [statusDown("Sp.DEF"), statusDown("Water DEF")],
    )
    .when(
      (name) => name === "援:Sp.ガードDOWN/副援:火ガードDOWN",
      () => [statusDown("Sp.DEF"), statusDown("Fire DEF")],
    )
    .when(
      (name) => name === "回:回復UP/副援:風ガードUP",
      () => ["RecoveryUp", statusUp("Wind DEF")],
    )
    .when(
      (name) => name === "回:回復UP/副援:水ガードUP",
      () => ["RecoveryUp", statusUp("Water DEF")],
    )
    .when(
      (name) => name === "回:回復UP/副援:火ガードUP",
      () => ["RecoveryUp", statusUp("Fire DEF")],
    )
    .when(
      (name) => name === "回:回復UP/副援:支援UP",
      () => ["RecoveryUp", "SupportUp"],
    )
    .when(
      (name) => name === "回:回復UP/ガードUP",
      () => ["RecoveryUp", statusUp("DEF")],
    )
    .when(
      (name) => name === "回:回復UP/Sp.ガードUP",
      () => ["RecoveryUp", statusUp("Sp.DEF")],
    )
    .when(
      (name) => name === "回:回復UP",
      () => ["RecoveryUp"],
    )
    .when(
      (name) => name === "回:パワーUP",
      () => [statusUp("ATK")],
    )
    .when(
      (name) => name === "回:ガードUP",
      () => [statusUp("DEF")],
    )
    .when(
      (name) => name === "回:ガードUP/副援:火ガードUP",
      () => [statusUp("DEF"), statusUp("Fire DEF")],
    )
    .when(
      (name) => name === "回:ガードUP/副援:水ガードUP",
      () => [statusUp("DEF"), statusUp("Water DEF")],
    )
    .when(
      (name) => name === "回:ガードUP/副援:風ガードUP",
      () => [statusUp("DEF"), statusUp("Wind DEF")],
    )
    .when(
      (name) => name === "回:WガードUP",
      () => [statusUp("DEF"), statusUp("Sp.DEF")],
    )
    .when(
      (name) => name === "回:Sp.パワーUP",
      () => [statusUp("Sp.ATK")],
    )
    .when(
      (name) => name === "回:Sp.ガードUP",
      () => [statusUp("Sp.DEF")],
    )
    .when(
      (name) => name === "回:Sp.ガードUP/副援:水ガードUP",
      () => [statusUp("Sp.DEF"), statusUp("Water DEF")],
    )
    .when(
      (name) => name === "回:Sp.ガードUP/副援:火ガードUP",
      () => [statusUp("Sp.DEF"), statusUp("Fire DEF")],
    )
    .when(
      (name) => name === "コ:MP消費DOWN",
      () => ["MpCostDown"],
    )
    .when(
      (name) => name === "コ:効果範囲+1",
      () => ["RangeUp"],
    )
    .run();

  return {
    trigger,
    kind: effects.flat(),
  };
}
