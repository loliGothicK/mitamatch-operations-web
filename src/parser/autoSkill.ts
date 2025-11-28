import { match } from "ts-pattern";
import { parseAmount } from "@/parser/common";
import { type Either, right, getApplicativeValidation } from "fp-ts/Either";
import { bail, type MitamaError, CallPath } from "@/error/error";
import { pipe } from "fp-ts/function";
import { toValidated, type Validated } from "@/fp-ts-ext/Validated";
import { getSemigroup } from "fp-ts/Array";
import { sequenceS } from "fp-ts/Apply";
import { fromNullable, type Option } from "fp-ts/Option";
import { option, either } from "fp-ts";
import { separator, transposeArray } from "@/fp-ts-ext/function";
import { Amount, StatusKind } from "@/evaluate/types";

export type Probability =
  | "certain" // 一定確率で
  | "medium" // 中確率で
  | "high"; // 高確率で

export type Trigger = "Attack" | "Assist" | "Recovery" | "Command";

type PossibleStatus = Exclude<
  StatusKind,
  "Life" | "Light ATK" | "Light DEF" | "Dark ATK" | "Dark DEF"
>;

export type SupportKind = {
  type:
    | "DamageUp"
    | "SupportUp"
    | "RecoveryUp"
    | "MatchPtUp"
    | "MpCostDown"
    | "RangeUp"
    | "UP"
    | "DOWN";
  amount: Amount;
  status?: PossibleStatus;
};

export type AutoSkill = {
  raw: {
    name: string;
    description: string;
  };
  trigger: Trigger;
  probability: Probability;
  effects: readonly SupportKind[];
};

const ap = getApplicativeValidation(getSemigroup<MitamaError>());

const parseProbability = (
  description: string,
  memoriaName: string,
  path: CallPath = new CallPath(),
): Either<MitamaError, Probability> =>
  match<string, Either<MitamaError, Probability>>(description)
    .when(
      (sentence) => sentence.includes("一定確率"),
      () => right("certain"),
    )
    .when(
      (sentence) => sentence.includes("中確率"),
      () => right("medium"),
    )
    .when(
      (sentence) => sentence.includes("高確率"),
      () => right("high"),
    )
    .otherwise(() =>
      bail(description, `given text doesn't include any probability`, {
        path: path.join("parseProbability"),
        memoriaName,
      }),
    );

const STATUS =
  /(ATK.*?|DEF.*?|Sp\.ATK.*?|Sp\.DEF.*?|火属性.*?|水属性.*?|風属性.*?)を.*?(アップ|ダウン)/;

const parseSingleStatus = (
  status: string,
  path: CallPath = CallPath.empty,
): Validated<MitamaError, PossibleStatus[]> =>
  separator(
    status.split("と").map((stat) =>
      match<string, Either<MitamaError, PossibleStatus[]>>(stat)
        .with("ATK", () => right(["ATK"]))
        .with("DEF", () => right(["DEF"]))
        .with("Sp.ATK", () => right(["Sp.ATK"]))
        .with("Sp.DEF", () => right(["Sp.DEF"]))
        .with("火属性攻撃力", () => right(["Fire ATK"]))
        .with("水属性攻撃力", () => right(["Water ATK"]))
        .with("風属性攻撃力", () => right(["Wind ATK"]))
        .with("水属性攻撃力・風属性攻撃力", () => right(["Water ATK", "Wind ATK"]))
        .with("火属性防御力", () => right(["Fire DEF"]))
        .with("水属性防御力", () => right(["Water DEF"]))
        .with("風属性防御力", () => right(["Wind DEF"]))
        .with("水属性防御力・風属性防御力", () => right(["Water DEF", "Wind DEF"]))
        .with("火属性攻撃力・水属性攻撃力・風属性攻撃力", () =>
          right(["Fire ATK", "Water ATK", "Wind ATK"]),
        )
        .with("火属性防御力・水属性防御力・風属性防御力", () =>
          right(["Fire DEF", "Water DEF", "Wind DEF"]),
        )
        .otherwise((target) =>
          bail(target, `given text doesn't match any status`, {
            path: path.join("parseSingleStatus"),
          }),
        ),
    ),
  );

const parseUpDown = (upOrDown: string, memoriaName: string, path: CallPath = CallPath.empty) =>
  match<string, Either<MitamaError, "UP" | "DOWN">>(upOrDown)
    .when(
      (text) => text.includes("アップ"),
      () => right("UP" as const),
    )
    .when(
      (text) => text.includes("ダウン"),
      () => right("DOWN" as const),
    )
    .otherwise((target) =>
      bail(target, `given text doesn't include UP or DOWN`, {
        path: path.join("parseUpDown"),
        memoriaName,
      }),
    );

function parseStatus(
  description: string,
  memoriaName: string,
  path: CallPath = CallPath.empty,
): Option<Validated<MitamaError, SupportKind[]>> {
  const global = /(ATK|DEF|Sp\.ATK|Sp\.DEF|火属性|水属性|風属性).*?を.*?(アップ|ダウン)/g;
  const joined = () => path.join("parseStatus");

  return pipe(
    fromNullable(description.match(global)),
    option.flatMap((gmatch) =>
      pipe(
        gmatch.map((status) =>
          pipe(
            fromNullable(status.match(STATUS)),
            option.map(([, stat, upOrDown]) =>
              pipe(
                parseSingleStatus(stat, joined()),
                either.flatMap((stats) =>
                  separator(
                    stats.map((stat) =>
                      sequenceS(ap)({
                        type: toValidated(parseUpDown(upOrDown, memoriaName, joined())),
                        amount: toValidated(
                          parseAmount(upOrDown, {
                            path: joined(),
                            memoriaName,
                          }),
                        ),
                        status: right(stat),
                      }),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
        transposeArray,
        option.map(separator),
      ),
    ),
  );
}

const DAMAGE = /攻撃ダメージを(.*アップ)させる/;

function parseDamage(
  description: string,
  memoriaName: string,
  path: CallPath = CallPath.empty,
): Option<Validated<MitamaError, SupportKind[]>> {
  return pipe(
    fromNullable(description.match(DAMAGE)),
    option.map(([, up]) =>
      pipe(
        sequenceS(ap)({
          type: right("DamageUp" as const),
          amount: toValidated(parseAmount(up, { path: path.join("parseDamage"), memoriaName })),
        }),
        either.map((effect) => [effect]),
      ),
    ),
  );
}

const ASSIST = /支援\/妨害効果を(.*アップ)/;

export function parseAssit(
  description: string,
  memoriaName: string,
  path: CallPath = CallPath.empty,
): Option<Validated<MitamaError, SupportKind[]>> {
  return pipe(
    fromNullable(description.match(ASSIST)),
    option.map(([, up]) =>
      pipe(
        sequenceS(ap)({
          type: right("SupportUp" as const),
          amount: toValidated(parseAmount(up, { path: path.join("parseAssit"), memoriaName })),
        }),
        either.map((effect) => [effect]),
      ),
    ),
  );
}

const RECOVERY = /HPの回復量を(.*?アップ)/;

function parseRecovery(
  description: string,
  memoriaName: string,
  path: CallPath = CallPath.empty,
): Option<Validated<MitamaError, SupportKind[]>> {
  return pipe(
    fromNullable(description.match(RECOVERY)),
    option.map(([, up]) =>
      pipe(
        sequenceS(ap)({
          type: right("RecoveryUp" as const),
          amount: toValidated(parseAmount(up, { path: path.join("parseRecovery"), memoriaName })),
        }),
        either.map((effect) => [effect]),
      ),
    ),
  );
}

const MATCH_PT = /自身のマッチPtの獲得量が(.*?アップ)する。/;

function parseMatchPt(
  description: string,
  memoriaName: string,
  path: CallPath = CallPath.empty,
): Option<Validated<MitamaError, SupportKind[]>> {
  return pipe(
    fromNullable(description.match(MATCH_PT)),
    option.map(([, up]) =>
      pipe(
        sequenceS(ap)({
          type: right("MatchPtUp" as const),
          amount: toValidated(parseAmount(up, { path: path.join("parseMatchPt"), memoriaName })),
        }),
        either.map((effect) => [effect]),
      ),
    ),
  );
}

const COST_DOWN = /一定確率でMP消費を抑える/;

function parseMpCost(description: string): Option<Validated<MitamaError, SupportKind[]>> {
  return pipe(
    fromNullable(description.match(COST_DOWN)),
    option.map(() => right([{ type: "MpCostDown", amount: "medium" }])),
  );
}

const RANGE = /効果対象範囲が(.+)される/;

function parseRange(description: string): Option<Validated<MitamaError, SupportKind[]>> {
  return pipe(
    fromNullable(description.match(RANGE)),
    option.map(() => right([{ type: "RangeUp", amount: "medium" }])),
  );
}

const parseTrigger = (
  skillName: string,
  memoriaName: string,
  path: CallPath = CallPath.empty,
): Either<MitamaError, Trigger> =>
  match<string, Either<MitamaError, Trigger>>(skillName)
    .when(
      (name) => name.startsWith("攻:"),
      () => right("Attack"),
    )
    .when(
      (name) => name.startsWith("援:"),
      () => right("Assist"),
    )
    .when(
      (name) => name.startsWith("回:"),
      () => right("Recovery"),
    )
    .when(
      (name) => name.startsWith("コ:"),
      () => right("Command"),
    )
    .otherwise(() =>
      bail(skillName, "no match trigger found", {
        path: path.join("parseTrigger"),
        memoriaName,
      }),
    );

const parseEffects = (
  description: string,
  memoriaName: string,
  path: CallPath = CallPath.empty,
): Validated<MitamaError, readonly SupportKind[]> => {
  const joined = path.join("parseEffects");
  const effects = [
    parseRange(description),
    parseMpCost(description),
    parseStatus(description, memoriaName, joined),
    parseDamage(description, memoriaName, joined),
    parseAssit(description, memoriaName, joined),
    parseRecovery(description, memoriaName, joined),
    parseMatchPt(description, memoriaName, joined),
  ];
  return pipe(
    transposeArray(effects),
    option.map(separator),
    option.getOrElse(() =>
      toValidated(
        bail(description, "No match support effects found", {
          path: joined,
          memoriaName,
        }),
      ),
    ),
  );
};

export function parseAutoSkill({
  memoriaName,
  autoSkill,
}: {
  memoriaName: string;
  autoSkill: {
    name: string;
    description: string;
  };
}): Validated<MitamaError, AutoSkill> {
  const path = new CallPath(["parseAutoSkill"]);
  return sequenceS(ap)({
    raw: right(autoSkill),
    trigger: toValidated(parseTrigger(autoSkill.name, memoriaName, path)),
    probability: toValidated(parseProbability(autoSkill.description, memoriaName, path)),
    effects: parseEffects(autoSkill.description, memoriaName, path),
  });
}
