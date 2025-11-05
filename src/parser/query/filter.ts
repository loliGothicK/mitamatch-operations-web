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

const ap = getApplicativeValidation(getSemigroup<MitamaError>());

export default function build<T>(
  expr: BinaryExpr,
  schemaResolver: SchemaResolver<T>,
): Validated<MitamaError, IExpression<T>> {
  type Input = AtomicExpr | BinaryExpr | AtomicExprList;
  const intoOperator = (
    operator: string,
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

      .otherwise(() => anyhow("operator", `Unsupported operator: ${operator}`));

  const cvt = (input: Input) =>
    match<Input, Validated<MitamaError, IExpression<T>>>(input)

      .with(
        { type: "binary_expr" },
        (binary): Validated<MitamaError, IExpression<T>> =>
          pipe(
            sequenceS(ap)({
              left: cvt(binary.lhs),
              operator: toValidated(intoOperator(binary.operator)),
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
