"use client";

import { JSX } from "react";
import { List, ListItem, ListItemText, ListSubheader, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { either, option } from "fp-ts";
import { pipe } from "fp-ts/function";
import type { GridSortDirection, GridSortModel } from "@mui/x-data-grid";
import { decodeTime } from "ulid";
import Link from "@/components/link";
import type { ComleteCandidate } from "@/data/_common/autocomplete";
import { Lenz } from "@/domain/lenz";
import { formatCardType, memoriaList, type Memoria } from "@/domain/memoria/memoria";
import type { MitamaError, ValidateResult } from "@/error/error";
import type { SchemaResolver } from "@/parser/query/filter";
import build from "@/parser/query/filter";
import { sqlToModel } from "@/parser/query/sql";
import type { Attribute } from "@/parser/skill";
import { match } from "ts-pattern";

export const memoriaQuerySchema = {
  memoria: [
    "name",
    "type",
    "attribute",
    "cost",
    "atk",
    "spatk",
    "def",
    "spdef",
    "released_at",
    "questSkill",
    "gvgSkill",
    "autoSkill",
    "label",
  ],
};

const formatAttribute = (attribute: Attribute) =>
  match(attribute)
    .with("Fire", () => "火")
    .with("Water", () => "水")
    .with("Wind", () => "風")
    .with("Light", () => "光")
    .with("Dark", () => "闇")
    .exhaustive();

export const memoriaQueryResolver: SchemaResolver<Memoria> = {
  name: {
    type: "string",
    accessor: (memoria: Memoria) => Lenz.memoria.general.fullName.get(memoria),
  },
  type: {
    type: "string",
    accessor: (memoria: Memoria) => formatCardType(Lenz.memoria.general.cardType.get(memoria)),
  },
  attribute: {
    type: "string",
    accessor: (memoria: Memoria) => formatAttribute(Lenz.memoria.general.attribute.get(memoria)),
  },
  cost: {
    type: "number",
    accessor: (memoria: Memoria) => Lenz.memoria.general.cost.get(memoria),
  },
  atk: {
    type: "number",
    accessor: (memoria: Memoria) => Lenz.memoria.general.atk.get(memoria),
  },
  spatk: {
    type: "number",
    accessor: (memoria: Memoria) => Lenz.memoria.general.spatk.get(memoria),
  },
  def: {
    type: "number",
    accessor: (memoria: Memoria) => Lenz.memoria.general.def.get(memoria),
  },
  spdef: {
    type: "number",
    accessor: (memoria: Memoria) => Lenz.memoria.general.spdef.get(memoria),
  },
  released_at: {
    type: "number",
    accessor: (memoria: Memoria) => decodeTime(memoria.id),
  },
  questSkill: {
    type: "clazz",
    accessor: (memoria: Memoria) => ({
      type: "memoriaSkill",
      data: Lenz.memoria.general.questSkill.get(memoria).raw,
    }),
  },
  "questSkill.name": {
    type: "string",
    accessor: (memoria: Memoria) => Lenz.memoria.general.questSkill.get(memoria).raw.name,
  },
  "questSkill.description": {
    type: "string",
    accessor: (memoria: Memoria) => Lenz.memoria.general.questSkill.get(memoria).raw.description,
  },
  gvgSkill: {
    type: "clazz",
    accessor: (memoria: Memoria) => ({
      type: "memoriaSkill",
      data: Lenz.memoria.general.gvgSkill.get(memoria).raw,
    }),
  },
  "gvgSkill.name": {
    type: "string",
    accessor: (memoria: Memoria) => Lenz.memoria.general.gvgSkill.get(memoria).raw.name,
  },
  "gvgSkill.description": {
    type: "string",
    accessor: (memoria: Memoria) => Lenz.memoria.general.gvgSkill.get(memoria).raw.description,
  },
  autoSkill: {
    type: "clazz",
    accessor: (memoria: Memoria) => ({
      type: "memoriaSkill",
      data: Lenz.memoria.general.autoSkill.get(memoria).raw,
    }),
  },
  "autoSkill.name": {
    type: "string",
    accessor: (memoria: Memoria) => Lenz.memoria.general.autoSkill.get(memoria).raw.name,
  },
  "autoSkill.description": {
    type: "string",
    accessor: (memoria: Memoria) => Lenz.memoria.general.autoSkill.get(memoria).raw.description,
  },
  label: {
    type: "clazz",
    accessor: (memoria: Memoria) => ({
      type: "labels",
      data: Lenz.memoria.general.labels.get(memoria),
    }),
  },
};

export const memoriaQueryCompletion: Record<string, ComleteCandidate> = {
  type: {
    equals: ["通常単体", "通常範囲", "特殊単体", "特殊範囲", "支援", "妨害", "回復"],
    like: {
      pattern: ["前衛", "後衛", "通常", "特殊"],
      item: "string",
      operator: (item: string, pattern: string): boolean => {
        return match(pattern)
          .with("前衛", () => ["通常単体", "通常範囲", "特殊単体", "特殊範囲"].includes(item))
          .with("後衛", () => ["支援", "妨害", "回復"].includes(item))
          .with("通常", () => ["通常単体", "通常範囲"].includes(item))
          .with("特殊", () => ["特殊単体", "特殊範囲"].includes(item))
          .run();
      },
    },
  },
  attribute: {
    equals: ["火", "水", "風", "光", "闇"],
  },
  questSkill: {
    json: ["name", "description"],
  },
  gvgSkill: {
    json: ["name", "description"],
  },
  autoSkill: {
    json: ["name", "description"],
  },
  label: {
    equals: ["legendary", "ultimate"],
  },
};

const TABLE_DEF: [string, string][] = [
  ["name", "text"],
  ["type", "text"],
  ["attribute", "text"],
  ["cost", "integer"],
  ["atk", "integer"],
  ["spatk", "integer"],
  ["def", "integer"],
  ["spdef", "integer"],
  ["released_at", "timestamp"],
  ["questSkill", "json"],
  ["gvgSkill", "json"],
  ["autoSkill", "json"],
  ["label", "text"],
];

export function getDefaultDeckBuilderQuery(sw: "sword" | "shield") {
  const target = sw === "sword" ? "前衛" : "後衛";
  return `SELECT * FROM memoria WHERE \`type\` LIKE '${target}' ORDER BY \`released_at\` DESC;`;
}

function matchesUnitSide(memoria: Memoria, sw: "sword" | "shield") {
  return sw === "sword" ? memoria.cardType < 5 : memoria.cardType > 4;
}

export function shouldResetDeckBuilderQueryForSw(query: string, sw: "sword" | "shield") {
  const source = memoriaList.filter((memoria) => memoria.phantasm !== true);
  const validated = runMemoriaQuery(source, query);
  if (validated._tag === "Left") {
    return true;
  }
  if (validated.right.length === 0) {
    return false;
  }

  return validated.right.every((memoria) => !matchesUnitSide(memoria, sw));
}

function comparePrimitive(
  left: string | number | boolean | null,
  right: string | number | boolean | null,
  direction: GridSortDirection,
) {
  if (left === right) {
    return 0;
  }
  if (left === null) {
    return 1;
  }
  if (right === null) {
    return -1;
  }

  const result =
    typeof left === "number" && typeof right === "number"
      ? left - right
      : String(left).localeCompare(String(right), "ja");

  return direction === "desc" ? -result : result;
}

function applySortModel<T extends Memoria>(source: T[], sortModel: GridSortModel) {
  if (sortModel.length === 0) {
    return source;
  }

  return [...source].sort((left, right) => {
    for (const { field, sort = "asc" } of sortModel) {
      const entry = memoriaQueryResolver[field];
      if (!entry || entry.type === "clazz") {
        continue;
      }

      const order = comparePrimitive(entry.accessor(left), entry.accessor(right), sort);
      if (order !== 0) {
        return order;
      }
    }

    return 0;
  });
}

export function runMemoriaQuery<T extends Memoria>(
  source: T[],
  query: string,
): ValidateResult<T[]> {
  return pipe(
    validateMemoriaQuery(query),
    either.map(() => source),
    either.flatMap((source) =>
      pipe(
        sqlToModel(query),
        either.flatMap((parsed) => build(parsed, memoriaQueryResolver, memoriaQueryCompletion)),
        either.map((compiled) => {
          const filtered: T[] = pipe(
            compiled.where,
            option.map((expr) => source.filter((memoria) => Boolean(expr.apply(memoria)))),
            option.getOrElse(() => source),
          );
          const limited = compiled.limit(filtered) as T[];
          return pipe(
            compiled.orderBy,
            option.map((model) => applySortModel(limited, model)),
            option.getOrElse(() => limited),
          );
        }),
      ),
    ),
  );
}

export function validateMemoriaQuery(query: string): ValidateResult<true> {
  return pipe(
    sqlToModel(query),
    either.flatMap((parsed) => build(parsed, memoriaQueryResolver, memoriaQueryCompletion)),
    either.map(() => true as const),
  );
}

export function formatMitamaErrors(errors: MitamaError[]) {
  return errors.map((error) => error.msg).join("\n");
}

export function MemoriaQueryHelp(): JSX.Element {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        クエリ構文ヘルプ
      </Typography>
      <Typography variant="body1" component={"p"}>
        <Link href="https://docs.cloud.google.com/bigquery/docs/reference/standard-sql/query-syntax">
          {"GoogleSQL"}
        </Link>
        （for BigQuery）ライクなクエリを使用してデータをフィルタリング、ソートできます。
      </Typography>
      <List dense>
        <ListSubheader>サポートされているキーワード</ListSubheader>
        <ListItem>
          <ListItemText
            primary="SELECT"
            secondary="表示するカラムを選択します。例: SELECT `name`, `atk`"
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="WHERE"
            secondary="データをフィルタリングします。例: WHERE `cost` > 18 AND `type` LIKE '後衛'"
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="ORDER BY"
            secondary="データをソートします。例: ORDER BY `atk` DESC"
          />
        </ListItem>
        <ListItem>
          <ListItemText primary="LIMIT" secondary="表示する行数を制限します。例: LIMIT 10" />
        </ListItem>
      </List>
      <List dense>
        <ListSubheader>利用可能なカラム</ListSubheader>
        {TABLE_DEF.map(([col, type]) => (
          <ListItem key={col} sx={{ py: 0 }}>
            <ListItemText primary={`\`${col}\`: ${type}`} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
