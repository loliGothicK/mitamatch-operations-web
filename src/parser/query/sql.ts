import {
  type Binary,
  type Column,
  type ExpressionValue,
  type ExprList,
  type Function as SqlFunction,
  OrderBy,
  Parser,
} from "node-sql-parser";
import type { GridColDef } from "@mui/x-data-grid";
import { toValidated, type Validated } from "@/fp-ts-ext/Validated";
import { anyhow, type MitamaError } from "@/error/error";
import { getApplicativeValidation, isRight, right } from "fp-ts/Either";
import { match, P } from "ts-pattern";
import { pipe } from "fp-ts/function";
import { either, option } from "fp-ts";
import { separator } from "@/fp-ts-ext/function";
import { sequenceS } from "fp-ts/Apply";
import { getSemigroup } from "fp-ts/Array";
import type { Option } from "fp-ts/Option";
import { fromThrowable } from "neverthrow";

const parser = new Parser();
const ap = getApplicativeValidation(getSemigroup<MitamaError>());

export type ParseResult = {
  readonly where: Option<BinaryExpr>;
  readonly orderBy: Option<OrderByExpr[]>;
};

function isExpressionValueArray(data: any): data is ExpressionValue[] {
  if (!Array.isArray(data)) {
    return false;
  }
  return data.every((datum) => datum satisfies ExpressionValue);
}

function isBinary(binary: any): binary is Binary {
  return binary satisfies Binary;
}

type Value<T> = { type: "value"; value: T } | { type: "field"; value: string };
export type AtomicExpr = any extends { value: infer T } ? Value<T> : never;
export type AtomicExprList = AtomicExpr[];
export type BinaryExpr = {
  type: "binary_expr";
  lhs: AtomicExpr | BinaryExpr | AtomicExprList;
  operator: string;
  rhs: AtomicExpr | BinaryExpr | AtomicExprList;
};
export type OrderByExpr = {
  type: "order_by";
  target: AtomicExpr | BinaryExpr | AtomicExprList;
  direction: "ASC" | "DESC";
};

function parseExpr(
  expr: ExpressionValue | ExprList,
): Validated<MitamaError, AtomicExpr | AtomicExprList | BinaryExpr> {
  return match(expr)
    .with(
      {
        type: P.union(
          "param",
          "function",
          "case",
          "aggr_func",
          "cast",
          "interval",
        ),
      },
      ({ type }) => toValidated(anyhow(type, "unsupported expression type")),
    )
    .with(
      { type: "binary_expr" },
      (binary): Validated<MitamaError, BinaryExpr> => {
        if (isBinary(binary)) {
          return sequenceS(ap)({
            type: right("binary_expr" as const),
            lhs: parseExpr(binary.left),
            operator: right(binary.operator),
            rhs: parseExpr(binary.right),
          });
        } else {
          return toValidated(
            anyhow("binary_expr", "unsupported expression type"),
          );
        }
      },
    )
    .with({ type: "expr_list" }, (list) => {
      if (isExpressionValueArray(list.value)) {
        return separator(
          list.value.flatMap((expr) =>
            pipe(
              parseExpr(expr),
              either.flatMap((expr) =>
                match(expr)
                  .when(
                    (e) => Array.isArray(e),
                    (e) => right(e),
                  )
                  .otherwise(() =>
                    toValidated(
                      anyhow(
                        "expr_list",
                        "binary expression in exprssion list is not supported.",
                      ),
                    ),
                  ),
              ),
            ),
          ),
        );
      } else {
        return toValidated(anyhow("expr_list", "unsupported expression list"));
      }
    })
    .with({ type: "expr" }, () =>
      toValidated(anyhow("expr", "unsupported expression type")),
    )
    .with({ type: "column_ref" }, (column) =>
      match(column)
        .with({ value: P._ }, ({ value }) =>
          right({ type: "field" as const, value: value }),
        )
        .with({ column: P._ }, ({ column }) =>
          match(column)
            .with({ expr: P._ }, ({ expr: { type, value } }) =>
              match(type)
                .with("backticks_quote_string", () =>
                  right({ type: "field" as const, value: value as string }),
                )
                .with("string", () =>
                  right({ type: "value" as const, value: value as string }),
                )
                .with("default", () =>
                  right({ type: "field" as const, value: value as string }),
                )
                .otherwise(() =>
                  toValidated(
                    anyhow(
                      type,
                      `unsupported VALUE TYPE with \`${value}: ${type}\``,
                    ),
                  ),
                ),
            )
            .otherwise((column) =>
              right({ type: "field" as const, value: column as string }),
            ),
        )
        .exhaustive(),
    )
    .otherwise(({ value }) => right({ type: "value" as const, value }));
}

function parseBinary(
  operator: string,
  lhs: ExpressionValue | ExprList,
  rhs: ExpressionValue | ExprList,
): Validated<MitamaError, BinaryExpr> {
  return sequenceS(ap)({
    type: right("binary_expr" as const),
    lhs: parseExpr(lhs),
    operator: right(operator),
    rhs: parseExpr(rhs),
  });
}

function parseWhere(
  where: Binary | SqlFunction | null,
): Validated<MitamaError, Option<BinaryExpr>> {
  return match(where)
    .with(null, () => right(option.none))
    .otherwise((where) =>
      match(where)
        .with({ type: "function" }, () =>
          toValidated(
            anyhow(
              where.type,
              "SQL Functions are not supported in WHERE clause.",
            ),
          ),
        )
        .otherwise(({ left, operator, right }) =>
          pipe(
            parseBinary(operator, left, right),
            either.map((binary) => option.some(binary)),
          ),
        ),
    );
}

function parseOrderBy(
  orderby: OrderBy[] | null,
): Validated<MitamaError, Option<OrderByExpr[]>> {
  return match(orderby)
    .with(null, () => right(option.none))
    .otherwise((orderby) =>
      pipe(
        orderby.map((clause) =>
          sequenceS(ap)({
            type: right("order_by" as const),
            target: parseExpr(clause.expr),
            direction: right(clause.type),
          }),
        ),
        separator,
        either.map(option.some),
      ),
    );
}

type WhiteList = Set<GridColDef["field"]>;

export function sqlToModel(
  sql: string,
): Validated<MitamaError, [WhiteList, ParseResult]> {
  const ast = fromThrowable(parser.astify.bind(parser))(sql, {
    database: "MySQL",
  });

  if (ast.isErr()) {
    return toValidated(anyhow(sql, ast.error as string));
  }

  if (!Array.isArray(ast.value)) {
    return toValidated(
      anyhow(sql, "Multiple SQL statements are not supported."),
    );
  }

  if (ast.value[0].type === "select") {
    const stmt = ast.value[0];
    return pipe(
      sequenceS(ap)({
        where: parseWhere(stmt.where),
        orderBy: parseOrderBy(stmt.orderby),
      }),
      either.map(
        (filter) =>
          [
            stmt.columns.reduce<Set<GridColDef["field"]>>((acc, col) => {
              if (col satisfies Column) {
                const field = parseExpr(col.expr);
                if (isRight(field) && Array.isArray(field.right)) {
                  for (const f of field.right) {
                    if ("field" in f && typeof f.field === "string") {
                      acc.add(f.field);
                    }
                  }
                }
              }
              return acc;
            }, new Set()) || {},
            filter,
          ] as const,
      ),
    );
  } else {
    return toValidated(anyhow(sql, "Only SELECT statements are supported."));
  }
}
