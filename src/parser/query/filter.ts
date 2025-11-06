import type {
  AtomicExpr,
  AtomicExprList,
  BinaryExpr,
} from "@/parser/query/sql";
import { match } from "ts-pattern";
import { anyhow, type MitamaError } from "@/error/error";
import { type Either, getApplicativeValidation, right } from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import { either } from "fp-ts";
import { toValidated, type Validated } from "@/fp-ts-ext/Validated";
import { sequenceS } from "fp-ts/Apply";
import { getSemigroup } from "fp-ts/Array";
import { P } from 'ts-pattern';
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
  const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // 2. LIKEのワイルドカードを正規表現のワイルドカードに変換する
  //    '%' -> '.*'
  //    '_' -> '.'
  const regexString = escapedPattern
    .replace(/%/g, '.*')
    .replace(/_/g, '.');

  // 3. LIKEは文字列全体にマッチするため、'^' と '$' で囲む
  return new RegExp('^' + regexString + '$', flags);
}

export default function build<T>(
  expr: BinaryExpr,
  schemaResolver: SchemaResolver<T>,
): Validated<MitamaError, IExpression<T>> {
  type Input = AtomicExpr | BinaryExpr | AtomicExprList;
  const intoOperator = (
    operator: string,
    lhs: Input,
    rhs: Input,
  ): Either<MitamaError, (left: Lit, right: Lit) => boolean> =>
    match(operator)
      .with("=", () => right((left: Lit, right: Lit) => left === right))
      .with("!=", () => right((left: Lit, right: Lit) => left !== right))
      .with(">", () => right((left: Lit, right: Lit) => left > right))
      .with("<", () => right((left: Lit, right: Lit) => left < right))
      .with(">=", () => right((left: Lit, right: Lit) => left >= right))
      .with("<=", () => right((left: Lit, right: Lit) => left <= right))
      .with("AND", () =>
        right((left: Lit, right: Lit) => Boolean(left) && Boolean(right)),
      )
      .with("OR", () =>
        right((left: Lit, right: Lit) => Boolean(left) || Boolean(right)),
      )
      .with('LIKE', () => match([lhs, rhs])
        .with([{ type: P.not('field') }, P.any], () => anyhow('LIKE', 'Invalid operands for LIKE operator. The left operand must be a column name.'))
        .with([P.any, { type: P.not('value') }], () => anyhow('LIKE', 'Invalid operands for LIKE operator. The left operand must be a string literal.'))
        .otherwise(() => {
          return right((left: Lit, right: Lit) => {
            return likeToRegExp(right as string).test(left as string);
          });
        })
      )
      .with('ILIKE', () => match([lhs, rhs])
        .with([{ type: P.not('field') }, P.any], () => anyhow('ILIKE', 'Invalid operands for LIKE operator. The left operand must be a column name.'))
        .with([P.any, { type: P.not('value') }], () => anyhow('ILIKE', 'Invalid operands for LIKE operator. The left operand must be a string literal.'))
        .otherwise(() => {
          return right((left: Lit, right: Lit) => {
            return likeToRegExp(right as string, 'i').test(left as string);
          });
        })
      )
      .otherwise(() => anyhow("operator", `Unsupported operator: ${operator}`));

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
        toValidated(anyhow("expr_list", "AtomicExprList is not supported yet")),
      )
      .otherwise((atomic) =>
        match<typeof atomic, Validated<MitamaError, IExpression<T>>>(atomic)
          .with({ type: "value" }, (lit) =>
            right(new Literal(lit.value as Lit)),
          )
          .with({ type: "field" }, (field) => {
            if (field.value in schemaResolver) {
              return right(new Field(schemaResolver[field.value as string]));
            } else {
              return toValidated(
                anyhow(
                  field.value,
                  `Cannot resolve ${field.value} with schema definition.`,
                ),
              );
            }
          })
          .exhaustive(),
      );

  return cvt(expr);
}

type Accessor<T> = (item: T) => string | number;
type SchemaResolver<T> = Record<string, Accessor<T>>;
type Lit = string | number | boolean;

/**
 * 実行可能な式の最小単位。
 * @param T データソースのitemの型
 * @param U この式が評価された結果の型 (number, string, booleanなど)
 */
interface IExpression<T> {
  apply(item: T): Lit;
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
 */
class Field<T> implements IExpression<T> {
  constructor(private getter: Accessor<T>) {}

  apply(item: T): Lit {
    return this.getter(item);
  }
}

class Binary<T> implements IExpression<T> {
  constructor(
    private left: IExpression<T>,
    private operator: (left: Lit, right: Lit) => boolean,
    private right: IExpression<T>,
  ) {}

  apply(item: T): boolean {
    return this.operator(this.left.apply(item), this.right.apply(item));
  }
}
