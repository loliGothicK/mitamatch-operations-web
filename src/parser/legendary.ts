import type { Attribute } from "@/parser/skill";
import type { Trigger } from "@/parser/autoSkill";
import { toValidated } from "@/fp-ts-ext/Validated";
import { bail, type MitamaError, CallPath, ValidateResult } from "@/error/error";
import { pipe } from "fp-ts/function";
import { either, option } from "fp-ts";
import { separator, transpose, transposeArray } from "@/fp-ts-ext/function";
import { getApplicativeValidation, right } from "fp-ts/Either";
import { getSemigroup } from "fp-ts/Array";
import { sequenceS } from "fp-ts/Apply";
import { match } from "ts-pattern";
import { parseFloatSafe } from "@/parser/common";
import type { RawLegendarySkill } from "@/domain/memoria/memoria";
import { Option } from "fp-ts/Option";

export type LegendarySkillTrigger =
  | Exclude<Trigger, "Attack">
  | "Attack/Physical"
  | "Attack/Magical";

export type LegendarySkill = {
  readonly attributes: Attribute[];
  readonly trigger: LegendarySkillTrigger;
  readonly rates: readonly [number, number, number, number, number];
  readonly criticalRates: Option<readonly [number, number, number, number, number]>;
};
export type Legendary = {
  readonly raw: RawLegendarySkill;
  readonly skill: LegendarySkill;
};

const LEGENDAEY_SKILL =
  /(.+?)属性の(.+?時)に.+?を(\d+?.*?\d*?)%アップさせる。(?:さらにクリティカル発動確率を(\d+?.*?\d*?)%アップさせる。)*/;

const parseAttribute = (
  element: string,
  meta: { path: CallPath; memoriaName?: string } = {
    path: CallPath.empty,
  },
) =>
  match<string, ValidateResult<Attribute>>(element)
    .with("火", () => right("Fire"))
    .with("水", () => right("Water"))
    .with("風", () => right("Wind"))
    .otherwise(() =>
      toValidated(
        bail(element, "given text does not match any attribute", {
          ...meta,
          path: meta.path.join("parseAttribute"),
        }),
      ),
    );

const parseTrigger = (
  trigger: string,
  meta: { path: CallPath; memoriaName?: string } = {
    path: CallPath.empty,
  },
) =>
  match<string, ValidateResult<LegendarySkillTrigger>>(trigger)
    .with("通常攻撃時", () => right("Attack/Physical"))
    .with("特殊攻撃時", () => right("Attack/Magical"))
    .with("支援/妨害メモリア使用時", () => right("Assist"))
    .with("回復メモリア使用時", () => right("Recovery"))
    .otherwise(() =>
      toValidated(
        bail(trigger, "given text does not match any trigger", {
          ...meta,
          path: meta.path.join("parseTrigger"),
        }),
      ),
    );

export function parseLegendary(
  skills: RawLegendarySkill,
  memoriaName: string,
): ValidateResult<Legendary> {
  const ap = getApplicativeValidation(getSemigroup<MitamaError>());
  const path = new CallPath(["parseLegendary"]);
  const toEither = (target: string) =>
    either.fromNullable<MitamaError>({
      target,
      msg: "given text does not match LEGENDAEY_SKILL",
      meta: {
        path: path.toString(),
      },
    });

  return pipe(
    skills.map((skill) =>
      pipe(
        skill.description.match(LEGENDAEY_SKILL),
        toEither(skill.description),
        either.flatMap(([, attributes, trigger, rate, critRate]) =>
          sequenceS(ap)({
            attributes: separator(
              attributes
                .split("/")
                .map((attribute) => parseAttribute(attribute, { path, memoriaName })),
            ),
            trigger: parseTrigger(trigger, { path, memoriaName }),
            rate: toValidated(parseFloatSafe(rate, { path, memoriaName })),
            criticalRate: toValidated(
              transpose(
                pipe(
                  option.fromNullable(critRate),
                  option.map((critRate) => parseFloatSafe(critRate, { path, memoriaName })),
                ),
              ),
            ),
          }),
        ),
      ),
    ),
    separator,
    either.map((parsed) => ({
      raw: skills,
      skill: {
        attributes: parsed[0].attributes,
        trigger: parsed[0].trigger,
        rates: parsed.map((skill) => skill.rate) as unknown as readonly [
          number,
          number,
          number,
          number,
          number,
        ],
        criticalRates: pipe(
          parsed.map((skill) => skill.criticalRate),
          transposeArray,
          option.map(
            (cirtRates) =>
              cirtRates as unknown as readonly [number, number, number, number, number],
          ),
        ),
      },
    })),
  );
}
