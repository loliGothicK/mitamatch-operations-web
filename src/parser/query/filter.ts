import type { AtomicExpr, AtomicExprList, BinaryExpr, ParseResult } from "@/parser/query/sql";
import { match } from "ts-pattern";
import { anyhow, bail, type MitamaError } from "@/error/error";
import { type Either, getApplicativeValidation, right } from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import { either, option } from "fp-ts";
import { toValidated, type Validated } from "@/fp-ts-ext/Validated";
import { sequenceS } from "fp-ts/Apply";
import { getSemigroup } from "fp-ts/Array";
import { P } from "ts-pattern";
import {isSome, Option} from "fp-ts/Option";
import { separator, transpose } from "@/fp-ts-ext/function";
import { ComleteCandidate } from "@/data/_common/autocomplete";
import { Costume } from "@/domain/costume/costume";
import { Memoria } from "@/domain/memoria/memoria";
const ap = getApplicativeValidation(getSemigroup<MitamaError>());

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
  expr: ParseResult,
  resolver: SchemaResolver<T>,
  completion?: Record<string, ComleteCandidate>,
): Validated<
  MitamaError,
  {
    readonly where: Option<IExpression<T>>;
    readonly orderBy: Option<IComparator<T>>;
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
  ): Either<MitamaError, (left: Lit, right: Lit) => Lit> =>
    match(operator)
      .with("=", () =>
        match(lhs)
          .with({ type: "field", value: "label" }, () =>
            right((left: Lit, right: Lit) =>
              ((left as Clazz).data as Memoria["labels"])
                .map((label) => label.toLowerCase())
                .includes(right as string),
            ),
          )
          .with({ type: "field", value: "specialSkill" }, () =>
            bail("specialSkill", "specialSkill cannot be compared, must be used LIKE operator."),
          )
          .otherwise(() => right((left: Lit, right: Lit) => left === right)),
      )
      .with("!=", () => right((left: Lit, right: Lit) => left !== right))
      .with(">", () => right((left: Lit, right: Lit) => left > right))
      .with("<", () => right((left: Lit, right: Lit) => left < right))
      .with(">=", () => right((left: Lit, right: Lit) => left >= right))
      .with("<=", () => right((left: Lit, right: Lit) => left <= right))
      .with("+", () =>
        match([lhs, rhs])
          .with([{ type: "field" }, { type: "field" }], ([lhs, rhs]) => {
            if (lhs.value in resolver && rhs.value in resolver) {
              if (
                resolver[lhs.value as string].type === "number" &&
                resolver[rhs.value as string].type === "number"
              ) {
                return right((left: Lit, right: Lit) => Number(left) + Number(right));
              } else if (
                resolver[lhs.value as string].type === "string" &&
                resolver[rhs.value as string].type === "string"
              ) {
                return right((left: Lit, right: Lit) => String(left) + String(right));
              } else {
                return bail("+", "Invalid operands for + operator.");
              }
            } else {
              return bail("+", "Invalid operands for + operator.");
            }
          })
          .otherwise(() => bail("+", "Invalid operands for + operator.")),
      )
      .with("AND", () => right((left: Lit, right: Lit) => Boolean(left) && Boolean(right)))
      .with("OR", () => right((left: Lit, right: Lit) => Boolean(left) || Boolean(right)))
      .with(P.union("LIKE", "ILIKE", "NOT LIKE", "NOT ILIKE"), (operator) =>
        match([lhs, rhs])
          .with([{ type: P.not("field") }, P.any], () =>
            bail(
              "LIKE",
              "Invalid operands for LIKE operator. The left operand must be a column name.",
            ),
          )
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
                    .with({ item: "string" }, ({ operator }) => (left: Lit, right: Lit) => {
                      return operator(left as string, right as string);
                    })
                    .with({ item: "clazz" }, ({ operator }) => (left: Lit, right: Lit) => {
                      return operator(left as Clazz, right as string);
                    })
                    .exhaustive(),
                ),
              );
            },
          )
          .with([{ type: "field" }, { type: "value" }], () => {
            return right((left: Lit, right: Lit) => {
              const field = left as string;
              const bool = operator.endsWith("ILIKE")
                ? likeToRegExp(right as string, "i").test(field)
                : likeToRegExp(right as string).test(field);
              return operator.startsWith("NOT") ? !bool : bool;
            });
          })
          .otherwise(() => bail("LIKE", "Invalid operands for LIKE operator.")),
      )
      .otherwise(() => bail("operator", `Unsupported operator: ${operator}`));

  const cvt = (input: Input) =>
    match<Input, Validated<MitamaError, IExpression<T>>>(input)
      .with(
        { type: "binary_expr" },
        (binary): Validated<MitamaError, IExpression<T>> =>
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
        match<typeof atomic, Validated<MitamaError, IExpression<T>>>(atomic)
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

  return sequenceS(ap)({
    where: transpose(pipe(expr.where, option.map(cvt))),
    orderBy: transpose(
      pipe(
        expr.orderBy,
        option.map((expr) =>
          pipe(
            separator(
              expr.map(({ target, direction }) =>
                sequenceS(ap)({
                  target: cvt(target),
                  direction: right(direction),
                }),
              ),
            ),
            either.map(
              (ir) => new OrderByClause(ir.map((ir) => new OrderBy(ir.target, ir.direction))),
            ),
          ),
        ),
      ),
    ),
    limit: right((arr: T[]): T[] => {
      if (isSome(expr.limit.limit)) {
        return arr.slice(pipe(expr.limit.offset, option.getOrElse(() => 0)), expr.limit.limit.value);
      }
      return arr;
    })
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
  | { type: "labels"; data: Memoria["labels"] };
type Lit = string | number | boolean | Clazz;

/**
 * 実行可能な式の最小単位。
 * @param T データソースのitemの型
 * @param U この式が評価された結果の型 (number, string, booleanなど)
 */
export interface IExpression<T> {
  apply(item: T): Lit;
}

export interface IComparator<T> {
  compare(a: T, b: T): number;
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
    private operator: (left: Lit, right: Lit) => Lit,
    private right: IExpression<T>,
  ) {}

  apply(item: T): Lit {
    return this.operator(this.left.apply(item), this.right.apply(item));
  }
}

class OrderBy<T> implements IComparator<T> {
  constructor(
    private target: IExpression<T>,
    private direction: "ASC" | "DESC",
  ) {}

  compare(a: T, b: T): number {
    const left = this.target.apply(a);
    const right = this.target.apply(b);

    if (left === right) {
      return 0;
    }

    if (this.direction === "ASC") {
      return left > right ? 1 : -1;
    }

    return left > right ? -1 : 1;
  }
}

/**
 * Represents an order-by clause used to compare objects.
 * This class provides functionality for sorting objects based on multiple criteria in the order specified.
 * It implements the IComparator interface to define a custom comparison logic.
 *
 * @template T The type of objects being compared.
 *
 * @implements IComparator<T>
 */
class OrderByClause<T> implements IComparator<T> {
  constructor(private comparators: OrderBy<T>[]) {}

  compare(a: T, b: T): number {
    // 辞書式順序で比較

    for (const comparator of this.comparators) {
      const result = comparator.compare(a, b);
      if (result !== 0) {
        return result;
      }
    }

    return 0;
  }
}
