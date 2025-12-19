import {
  type Binary,
  type Column,
  type ExpressionValue,
  type ExprList,
  type Function as SqlFunction,
  Limit,
  OrderBy,
  Parser,
} from "node-sql-parser";
import type { GridSortModel } from "@mui/x-data-grid";
import { toValidated, type Validated } from "@/fp-ts-ext/Validated";
import { bail, type MitamaError, ValidateResult } from "@/error/error";
import { getApplicativeValidation, right } from "fp-ts/Either";
import { match, P } from "ts-pattern";
import { pipe } from "fp-ts/function";
import { either, option } from "fp-ts";
import { separator } from "@/fp-ts-ext/function";
import { sequenceS } from "fp-ts/Apply";
import { getSemigroup } from "fp-ts/Array";
import type { Option } from "fp-ts/Option";
import { fromThrowable } from "neverthrow";
import { projector } from "@/functional/proj";

const parser = new Parser();
const ap = getApplicativeValidation(getSemigroup<MitamaError>());

type Columns = {
  readonly type: "column_ref" | "except";
  readonly columns: Set<string>;
};

export type ParseResult = {
  readonly where: Option<BinaryExpr>;
  readonly orderBy: Option<OrderByExpr>;
  readonly limit: {
    limit: Option<number>;
    offset: Option<number>;
  };
  readonly visibility: Columns;
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
  model: GridSortModel;
};

function parseExpr(
  expr: ExpressionValue | ExprList,
): Validated<MitamaError, AtomicExpr | AtomicExprList | BinaryExpr> {
  return match(expr)
    .with(
      {
        type: P.union("param", "function", "case", "aggr_func", "cast", "interval"),
      },
      ({ type }) => toValidated(bail(type, "unsupported expression type")),
    )
    .with({ type: "binary_expr" }, (binary): Validated<MitamaError, BinaryExpr> => {
      if (isBinary(binary)) {
        return sequenceS(ap)({
          type: right("binary_expr" as const),
          lhs: parseExpr(binary.left),
          operator: right(binary.operator),
          rhs: parseExpr(binary.right),
        });
      } else {
        return toValidated(bail("binary_expr", "unsupported expression type"));
      }
    })
    .with({ type: "expr_list" }, (list) => {
      if (isExpressionValueArray(list.value)) {
        return separator(
          list.value.flatMap((expr) =>
            pipe(
              parseExpr(expr),
              either.flatMap(
                (expr): ValidateResult<AtomicExpr | AtomicExprList> =>
                  match(expr)
                    .with({ type: "field", value: P.string }, right)
                    .when(
                      (e) => Array.isArray(e),
                      (e) => right(e),
                    )
                    .otherwise(() =>
                      toValidated(
                        bail(
                          "expr_list",
                          `${JSON.stringify(expr)} <- binary expression in exprssion list is not supported.`,
                        ),
                      ),
                    ),
              ),
            ),
          ),
        );
      } else {
        return toValidated(bail("expr_list", "unsupported expression list"));
      }
    })
    .with({ type: "expr" }, () => toValidated(bail("expr", "unsupported expression type")))
    .with(
      { type: "column_ref", table: P.string, column: P.string, subFields: P.array(P.string) },
      ({ table, column, subFields }) => {
        return right({
          type: "field" as const,
          value: `${table}.${[column].concat(subFields).join(".")}`,
        });
      },
    )
    .with({ type: "column_ref" }, (column) =>
      match(column)
        .with({ value: P._ }, ({ value }) => right({ type: "field" as const, value: value }))
        .with({ column: P._ }, ({ column }) =>
          match(column)
            .with({ expr: P._ }, ({ expr: { type, value } }) =>
              match(type)
                .with("backticks_quote_string", () =>
                  right({ type: "field" as const, value: value as string }),
                )
                .with("string", () => right({ type: "value" as const, value: value as string }))
                .with("default", () => right({ type: "field" as const, value: value as string }))
                .otherwise(() =>
                  toValidated(bail(type, `unsupported VALUE TYPE with \`${value}: ${type}\``)),
                ),
            )
            .otherwise((column) => right({ type: "field" as const, value: column as string })),
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
          toValidated(bail(where.type, "SQL Functions are not supported in WHERE clause.")),
        )
        .otherwise(({ left, operator, right }) =>
          pipe(
            parseBinary(operator, left, right),
            either.map((binary) => option.some(binary)),
          ),
        ),
    );
}

function parseOrderBy(orderby: OrderBy[] | null): Validated<MitamaError, Option<OrderByExpr>> {
  return match(orderby)
    .with(null, () => right(option.none))
    .otherwise((orderby) =>
      pipe(
        orderby.map((clause) =>
          sequenceS(ap)({
            field: pipe(
              parseExpr(clause.expr),
              either.flatMap((expr) =>
                match(expr)
                  .with({ type: "field", value: P.string.select() }, (col) => right(col as string))
                  .otherwise(() =>
                    toValidated(
                      bail("order by", "ONLY field name is supported in ORDER BY clause."),
                    ),
                  ),
              ),
            ),
            sort: right(
              match(clause.type)
                .with("ASC", () => "asc" as const)
                .with("DESC", () => "desc" as const)
                .otherwise(() => "asc" as const),
            ),
          }),
        ),
        separator,
        either.map((model) =>
          option.some({
            type: "order_by" as const,
            model,
          }),
        ),
      ),
    );
}

function parseLimit(limit: Limit | null): Validated<
  MitamaError,
  {
    limit: Option<number>;
    offset: Option<number>;
  }
> {
  return match(limit)
    .with(null, () =>
      right({
        limit: option.none,
        offset: option.none,
      }),
    )
    .otherwise(({ value }) =>
      right({
        limit: pipe(
          option.fromNullable(value.find(({ type }) => type === "limit")),
          option.map(({ value }) => value),
        ),
        offset: pipe(
          option.fromNullable(value.find(({ type }) => type === "offset")),
          option.map(({ value }) => value),
        ),
      }),
    );
}

export const parseColumns = (columns: Column[]): ValidateResult<Columns> => {
  return match(columns)
    .with([{ type: "except", expr_list: P.array().select() }], (columns) => {
      return pipe(
        parseColumns(columns as Column[]),
        either.map(({ columns }) => ({
          type: "except" as const,
          columns,
        })),
      );
    })
    .otherwise(() =>
      pipe(
        columns.map(projector("expr")).map(parseExpr),
        separator,
        either.map((exprs) => {
          return {
            type: "column_ref",
            columns: new Set(
              exprs
                .filter(
                  (
                    f,
                  ): f is {
                    type: "field";
                    value: string;
                  } => "type" in f && f.type === "field",
                )
                .map((f) => f.value),
            ),
          };
        }),
      ),
    );
};

export function sqlToModel(sql: string): ValidateResult<ParseResult> {
  const ast = fromThrowable(parser.astify.bind(parser))(sql, {
    database: "BigQuery",
  });

  if (ast.isErr()) {
    return toValidated(bail(sql, ast.error as string));
  }

  if (!Array.isArray(ast.value)) {
    return toValidated(bail(sql, "Multiple SQL statements are not supported."));
  }

  if (ast.value[0].type === "select") {
    const stmt = ast.value[0];
    return pipe(
      sequenceS(ap)({
        where: parseWhere(stmt.where),
        orderBy: parseOrderBy(stmt.orderby),
        limit: parseLimit(stmt.limit),
        visibility: parseColumns(stmt.columns),
      }),
    );
  } else {
    return toValidated(bail(sql, "Only SELECT statements are supported."));
  }
}

// function dbg<T>(x: T): T {
//   console.log(x);
//   return x;
// }
