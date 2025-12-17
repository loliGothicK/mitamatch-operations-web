import type {AtomicExpr, AtomicExprList, BinaryExpr, ParseResult} from "@/parser/query/sql";
import {match, P} from "ts-pattern";
import {anyhow, bail, type MitamaError, ValidateResult} from "@/error/error";
import {type Either, getApplicativeValidation, right} from "fp-ts/Either";
import {pipe} from "fp-ts/function";
import {either, option} from "fp-ts";
import {toValidated, type Validated} from "@/fp-ts-ext/Validated";
import {sequenceS} from "fp-ts/Apply";
import {getSemigroup} from "fp-ts/Array";
import {isSome, Option} from "fp-ts/Option";
import {separator, transpose} from "@/fp-ts-ext/function";
import {ComleteCandidate} from "@/data/_common/autocomplete";
import {Costume} from "@/domain/costume/costume";
import {Memoria} from "@/domain/memoria/memoria";
import {GridSortModel} from "@mui/x-data-grid";

const ap = getApplicativeValidation(getSemigroup<MitamaError>());

type Skill = { readonly name: string; readonly description: string; };

/**
 * SQLのLIKE句のパターン文字列を、
 * .test() で使用できるRegExpオブジェクトに変換します。
 * * - '%' は '.*' (0文字以上の任意の文字列) に変換されます。
 * - '_' は '.' (任意の1文字) に変換されます。
 * - それ以外の正規表現の特殊文字 (., +, *, ?, ^, $, {} など) は
 * エスケープされ、通常の文字として扱われます。
 *
 * @param pattern SQLのLIKEパターン (例: 'foo%bar_baz')
 * @param flags 正規表現のフラグ (例: 'i')
 * @returns マッチング用のRegExpオブジェクト
 */
function likeToRegExp(pattern: string, flags?: string): RegExp {
  // 1. 正規表現の特殊文字 (., +, * など) をエスケープする
  //    'file.txt' が 'file\.txt' になるようにする
  const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // 2. LIKEのワイルドカードを正規表現のワイルドカードに変換する
  //    '%' -> '.*'
  //    '_' -> '.'
  const regexString = escapedPattern.replace(/%/g, ".*").replace(/_/g, ".");

  // 3. LIKEは文字列全体にマッチするため、'^' と '$' で囲む
  return new RegExp("^" + regexString + "$", flags);
}

export default function build<T>(
  expr: Omit<ParseResult, "visibility">,
  resolver: SchemaResolver<T>,
  completion?: Record<string, ComleteCandidate>,
): Validated<
  MitamaError,
  {
    readonly where: Option<IExpression<T>>;
    readonly orderBy: Option<GridSortModel>;
    readonly limit: (data: T[]) => T[];
  }
> {
  type Input = AtomicExpr | BinaryExpr | AtomicExprList;

  const isLikeSpecialPattern = (pattern: string): pattern is string => {
    return (completion && pattern in completion && "like" in completion[pattern]) || false;
  };

  const intoOperator = (
    operator: string,
    lhs: Input,
    rhs: Input,
  ): Either<MitamaError, (left: Lit | null, right: Lit | null) => Lit | null> =>
    match(operator)
      .with("=", () =>
        match(lhs)
          .with({ type: "field", value: "label" }, () =>
            right((left: Lit | null, right: Lit | null) =>
              ((left as Clazz).data as Memoria["labels"])
                .map((label) => label.toLowerCase())
                .includes(right as string),
            ),
          )
          .with({ type: "field", value: "specialSkill" }, () =>
            bail("specialSkill", "specialSkill cannot be compared, must be used LIKE operator."),
          )
          .otherwise(() => right((left: Lit | null, right: Lit | null) => left === right)),
      )
      .with("!=", () => right((left: Lit | null, right: Lit | null) => left !== right))
      .with(">", () =>
        right((left: Lit | null, right: Lit | null) => !(left && right) || left > right),
      )
      .with("<", () =>
        right((left: Lit | null, right: Lit | null) => !(left && right) || left < right),
      )
      .with(">=", () =>
        right((left: Lit | null, right: Lit | null) => !(left && right) || left >= right),
      )
      .with("<=", () =>
        right((left: Lit | null, right: Lit | null) => !(left && right) || left <= right),
      )
      .with("+", () =>
        match([lhs, rhs])
          .with([{ type: "field" }, { type: "field" }], ([lhs, rhs]) => {
            if (lhs.value in resolver && rhs.value in resolver) {
              if (
                resolver[lhs.value as string].type === "number" &&
                resolver[rhs.value as string].type === "number"
              ) {
                return right((left: Lit | null, right: Lit | null) => Number(left) + Number(right));
              } else if (
                resolver[lhs.value as string].type === "string" &&
                resolver[rhs.value as string].type === "string"
              ) {
                return right((left: Lit | null, right: Lit | null) => String(left) + String(right));
              } else {
                return bail("+", "Invalid operands for + operator.");
              }
            } else {
              return bail("+", "Invalid operands for + operator.");
            }
          })
          .otherwise(() => bail("+", "Invalid operands for + operator.")),
      )
      .with("AND", () =>
        right((left: Lit | null, right: Lit | null) => Boolean(left) && Boolean(right)),
      )
      .with("OR", () =>
        right((left: Lit | null, right: Lit | null) => Boolean(left) || Boolean(right)),
      )
      .with(P.union("LIKE", "ILIKE", "NOT LIKE", "NOT ILIKE"), (operator) =>
        match([lhs, rhs])
          .with([P.any, { type: P.not("value") }], () =>
            bail(
              "LIKE",
              "Invalid operands for LIKE operator. The left operand must be a string literal.",
            ),
          )
          .with(
            [
              {
                type: "field",
                value: P.string.and(P.when(isLikeSpecialPattern)).select(),
              },
              { type: "value" },
            ],
            (key) => {
              return pipe(
                either.fromNullable(anyhow("completion", "completion source not found"))(
                  completion ? completion[key].like : undefined,
                ),
                either.map((like) =>
                  match(like)
                    .with(
                      { item: "string" },
                      ({ operator }) =>
                        (left: Lit | null, right: Lit | null) => {
                          return operator(left as string, right as string);
                        },
                    )
                    .with(
                      { item: "clazz" },
                      ({ operator }) =>
                        (left: Lit | null, right: Lit | null) => {
                          return operator(left as Clazz, right as string);
                        },
                    )
                    .exhaustive(),
                ),
              );
            },
          )
          .with([{ type: P.union("field", "binary_expr") }, { type: "value" }], () => {
            return right((left: Lit | null, right: Lit | null) => {
              const field = left as string;
              const bool = operator.endsWith("ILIKE")
                ? likeToRegExp(right as string, "i").test(field)
                : likeToRegExp(right as string).test(field);
              return operator.startsWith("NOT") ? !bool : bool;
            });
          })
          .otherwise(() => bail("LIKE", "Invalid operands for LIKE operator.")),
      )
      .with(P.union("->>", "->"), (EXTRACTOR) =>
        match([lhs, rhs])
          .with([{ type: "field" }, { type: "value" }], ([lhs, rhs]) => {
            const field = lhs.value as string;
            const path = rhs.value as string;

            if (field in resolver && resolver[field].type === "clazz") {
              return match(field)
                .with(P.union("rareSkill", "questSkill", "gvgSkill", "autoSkill"), (clazz) =>
                  match(path)
                    .with("$.name", () =>
                      right((left: Lit | null, _: Lit | null) => {
                        return ((left as Clazz).data as Skill).name;
                      }),
                    )
                    .with("$.description", () =>
                      right((left: Lit | null, _: Lit | null) => {
                        return ((left as Clazz).data as Skill).description;
                      }),
                    )
                    .otherwise(() =>
                      bail(
                        EXTRACTOR,
                        `Invalid path (${path}) for ${EXTRACTOR} operator. Only "$.name" and "$.description" is allowd for ${clazz}.`,
                      ),
                    ),
                )
                .otherwise(() => bail(EXTRACTOR, "Invalid path for ->> operator."));
            } else {
              return bail(EXTRACTOR, "Invalid operands for ->> operator.");
            }
          })
          .otherwise(() => bail(EXTRACTOR, "Invalid operands for ->> operator.")),
      )
      .otherwise(() => bail("operator", `Unsupported operator: ${operator}`));

  const cvt = (input: Input) =>
    match<Input, ValidateResult<IExpression<T>>>(input)
      .with(
        { type: "binary_expr" },
        (binary): ValidateResult<IExpression<T>> =>
          pipe(
            sequenceS(ap)({
              left: cvt(binary.lhs),
              operator: toValidated(intoOperator(binary.operator, binary.lhs, binary.rhs)),
              right: cvt(binary.rhs),
            }),
            either.map(({ left, operator, right }) => {
              return new Binary(left, operator, right);
            }),
          ),
      )
      .when(Array.isArray, () =>
        toValidated(bail("expr_list", "AtomicExprList is not supported yet")),
      )
      .otherwise((atomic) =>
        match<typeof atomic, ValidateResult<IExpression<T>>>(atomic)
          .with({ type: "value" }, (lit) => right(new Literal(lit.value as Lit)))
          .with({ type: "field", value: P.string.select() }, (field) => {
            if (field in resolver) {
              return right(new Field(resolver[field].accessor));
            } else {
              return toValidated(bail(field, `Cannot resolve ${field} with schema definition.`));
            }
          })
          .exhaustive(),
      );

  const columnValidate = (model: GridSortModel[number]) => {
    if (model.field in resolver) {
      return right(model);
    } else {
      return toValidated(
        bail(model.field, `Cannot resolve ${model.field} with schema definition.`),
      );
    }
  };

  return sequenceS(ap)({
    where: transpose(pipe(expr.where, option.map(cvt))),
    orderBy: transpose(
      pipe(
        expr.orderBy,
        option.map((orderby) => pipe(orderby.model.map(columnValidate), separator)),
      ),
    ),
    limit: right((arr: T[]): T[] => {
      if (isSome(expr.limit.limit)) {
        return arr.slice(
          pipe(
            expr.limit.offset,
            option.getOrElse(() => 0),
          ),
          expr.limit.limit.value,
        );
      }
      return arr;
    }),
  });
}

type Accessor<T, R> = (item: T) => R;
export type SchemaResolver<T> = Record<
  string,
  | {
      readonly type: "string";
      readonly accessor: Accessor<T, string>;
    }
  | {
      readonly type: "number";
      readonly accessor: Accessor<T, number>;
    }
  | {
      readonly type: "clazz";
      readonly accessor: Accessor<T, Clazz>;
    }
>;
export type Clazz =
  | { type: "specialSkill"; data: Costume["specialSkill"] }
  | { type: "rareSkill"; data: Costume["rareSkill"] }
  | { type: "labels"; data: Memoria["labels"] }
  | { type: "memoriaSkill"; data: { name: string; description: string; } };
type Lit = string | number | boolean | Clazz;

/**
 * 実行可能な式の最小単位。
 * @param T データソースのitemの型
 */
export interface IExpression<T> {
  apply(item: T): Lit | null;
}

/**
 * リテラル値（固定値）を表す式。
 * item (T) に依存せず、常に構築時の値を返す。
 */
class Literal<T> implements IExpression<T> {
  constructor(private value: Lit) {}

  apply(_: T): Lit {
    return this.value;
  }
}

/**
 * itemの特定のフィールド（キー）にアクセスする式。
 * @param T データソースのitemの型
 */
class Field<T> implements IExpression<T> {
  constructor(private getter: Accessor<T, Lit>) {}

  apply(item: T): Lit {
    return this.getter(item);
  }
}

/**
 * 二項演算子を表す式。
 * @param T データソースのitemの型
 */
class Binary<T> implements IExpression<T> {
  constructor(
    private left: IExpression<T>,
    private operator: (left: Lit | null, right: Lit | null) => Lit | null,
    private right: IExpression<T>,
  ) {}

  apply(item: T): Lit | null {
    return this.operator(this.left.apply(item), this.right.apply(item));
  }
}
